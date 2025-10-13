import { Inject, Injectable } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { GenerateStudyPlanDto } from './dto/generateStudyPlanDto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyPlan } from './entity/study_plan.entity';
import { Flashcard, FlashcardContent } from './entity/flashcard.entity';
import { UpdateTaskCompletionDto } from './dto/updateTaskCompletion.dto';
import { BulkUpdateTaskCompletionDto } from './dto/bulkUpdateTaskCompletion.dto';
import { UpdateStudyTimeDto } from './dto/updateStudyTime.dto';
import { GenerateFlashcardsDto } from './dto/generateFlashcards.dto';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class AiMsService {
  private readonly logger = new Logger(AiMsService.name);

  constructor(
    private readonly gemini: GeminiProvider,
    @Inject('WORKSPACE_SERVICE') private readonly workspaceService: ClientProxy,
    @Inject('QUIZ_SERVICE') private readonly quizService: ClientProxy,
    @Inject('STORAGE_SERVICE') private readonly storageService: ClientProxy,
    @Inject('ANALYTICS_SERVICE') private readonly analyticsClient: ClientProxy,
    @InjectRepository(StudyPlan)
    private studyPlanRepository: Repository<StudyPlan>,
    @InjectRepository(Flashcard)
    private flashcardRepository: Repository<Flashcard>,
  ) {}

  async generateStudyPlan(data: GenerateStudyPlanDto) {
    // const workspaces = await this.fetchAndPrepareWorkspaces(data.userId);
    const filesUnderWorkspaces = await this.fetchAndPrepareDocuments(
      data.userId,
    );
    const attemptedQuizzesWithWorkspaces = await this.fetchUserAttemptedQuizzes(
      data.userId,
    );
    const model = this.gemini.getModel('gemini-2.0-flash');

    const prompt = `
      You are a personalized study assistant.
      Generate a personalized study plan for user: .
      give answer in json format.
      
      workspaces are like modules enrolled by the user and this contains list of workspaces that user has enrolled and details
      of resources under each workspace. ${filesUnderWorkspaces ? JSON.stringify(filesUnderWorkspaces) : 'No workspaces or documents found'}
      
      This is the list of quizzes attempted by the user under different workspaces with details like score, time taken, attempt number etc.
      ${attemptedQuizzesWithWorkspaces ? JSON.stringify(attemptedQuizzesWithWorkspaces) : 'No quizzes attempted yet'}
      so you can say review this quiz again, or study things related to that module based on results.
      
      user input data is ${JSON.stringify(data)}

      
      
      The plan should include:
      - Topic breakdown by day
      - Recommended study time per topic
      - Practice suggestions
      - JSON format:
      [
            {
              day: "Monday",
              tasks: [
                {
                  id: "mon-1",
                  task: "Read 'Normalization Guide.pdf' (pages 1-10)",
                  topic: "Normalization",
                  estimatedTime: "45 min",
                  estimatedMinutes: 45,
                  type: "reading",
                  completed: false
                },
                {
                  id: "mon-2",
                  task: "Watch 'ER Diagram Tutorial.mp4' (first 30 min)",
                  topic: "ER Diagrams", 
                  estimatedTime: "30 min",
                  estimatedMinutes: 30,
                  type: "video",
                  completed: true
                }
              ],
              totalTime: "1h 15min",
              totalMinutes: 75,
              actualStudyTime: 60
            },
            {
              day: "Tuesday", 
              tasks: [
                {
                  id: "tue-1",
                  task: "Practice Quiz on ER Diagrams",
                  topic: "ER Diagrams",
                  estimatedTime: "30 min",
                  estimatedMinutes: 30,
                  type: "quiz",
                  completed: false
                },
                {
                  id: "tue-2",
                  task: "Database Design Practice Problems",
                  topic: "Database Design",
                  estimatedTime: "45 min",
                  estimatedMinutes: 45,
                  type: "practice",
                  completed: false
                }
              ],
              totalTime: "1h 15min",
              totalMinutes: 75,
              actualStudyTime: 80
            },
            for all 7 days of the week
        ]
      Ensure the JSON is properly formatted.(THIS IS STRICT, no extra text outside the JSON, array of days with tasks inside)





      
    `;

    const result = await model.generateContent(prompt);

    let parsed = this.parseGeminiJSON(result.response.text());
    // console.log(parsed)
    if (!parsed) {
      parsed = { raw: result.response.text() };
    }
    // Save the study plan to the database
    const studyPlan = this.studyPlanRepository.create({
      userId: data.userId,
      plan: parsed,
      // inputData: data, // Optionally store the original input
    });
    const saved = await this.studyPlanRepository.save(studyPlan);

    //Log the generation of the study plan in the analytics service
    await lastValueFrom(
      this.analyticsClient.send(
        { cmd: 'log_user_activity' },
        {
          user_id: saved.userId,
          category: 'AI_LEARNING',
          activity_type: 'CREATED_STUDY_PLAN',
          metadata: {
            createdAt: saved.createdAt,
          },
        },
      ),
    );

    return {
      success: true,
      data: parsed,
      message: 'Study plan generated successfully',
    };
  }

  async getStudyPlan(userId: string) {
    const studyPlan = await this.studyPlanRepository.findOne({
      where: { userId },
    });
    if (!studyPlan) {
      return { success: false, message: 'No study plan found for this user' };
    }

    return {
      success: true,
      data: studyPlan,
      message: 'Study plan retrieved successfully',
    };
  }

  //Updating functions for task completion and study time

  async updateTaskCompletion(data: UpdateTaskCompletionDto) {
    const { userId, taskId, completed, dayName } = data;
    const studyPlan = await this.studyPlanRepository.findOne({
      where: { userId },
    });
    if (!studyPlan) {
      return { success: false, message: 'No study plan found for this user' };
    }
    const plan = studyPlan.plan;
    let taskFound = false;

    for (const day of plan) {
      for (const task of day.tasks) {
        if (task.id === taskId) {
          task.completed = completed;
          taskFound = true;
          break;
        }
      }
      if (taskFound) break;
    }

    if (!taskFound) {
      return { success: false, message: 'Task not found' };
    }

    await this.studyPlanRepository.save(studyPlan);

    return {
      success: true,
      message: 'Task completion updated successfully',
    };
  }

  async bulkUpdateTaskCompletion(data: BulkUpdateTaskCompletionDto) {
    const { userId, taskIds, completed, dayName, actualStudyTime } = data;
    const studyPlan = await this.studyPlanRepository.findOne({
      where: { userId },
    });
    if (!studyPlan) {
      return { success: false, message: 'No study plan found for this user' };
    }
    const plan = studyPlan.plan;
    let tasksUpdated = 0;
    for (const day of plan) {
      if (day.day === dayName) {
        day.actualStudyTime = actualStudyTime ?? 0;
        for (const task of day.tasks) {
          if (taskIds.includes(task.id)) {
            task.completed = completed;
            tasksUpdated++;
          }
        }
      }
    }

    if (actualStudyTime !== undefined) {
      studyPlan.plan.actualStudyTime = actualStudyTime;
    }

    await this.studyPlanRepository.save(studyPlan);

    return {
      success: true,
      data: { tasksUpdated },
      message: 'Task completion updated successfully',
    };
  }

  async updateStudyTime(data: UpdateStudyTimeDto) {
    const { userId, actualStudyTime, dayName } = data;
    const studyPlan = await this.studyPlanRepository.findOne({
      where: { userId },
    });
    if (!studyPlan) {
      return { success: false, message: 'No study plan found for this user' };
    }
    const plan = studyPlan.plan;
    let dayFound = false;
    for (const day of plan) {
      if (day.day === dayName) {
        day.actualStudyTime = actualStudyTime;
        dayFound = true;
        break;
      }
    }

    if (!dayFound) {
      return { success: false, message: 'Day not found' };
    }

    await this.studyPlanRepository.save(studyPlan);
    return {
      success: true,
      message: 'Study time updated successfully',
    };
  }

  //supporting function to fetch and prepare data from other microservices

  async fetchAndPrepareWorkspaces(userId: string) {
    try {
      const allWorkspacesData = await firstValueFrom(
        this.workspaceService.send(
          { cmd: 'get_workspaces_by_user' },
          { userId },
        ),
      );
      const workspaces = allWorkspacesData.data.map((ws: any) => ({
        name: ws.name,
        description: ws.description,
      }));

      return workspaces;
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      return { success: false, message: 'Failed to fetch workspaces' };
    }
  }

  async fetchAllUserJoinedGroups(userId: string) {
    try {
      const response = await firstValueFrom(
        this.workspaceService.send({ cmd: 'get_groups_by_user' }, { userId }),
      );
      if (!response.success) {
        return [];
      }
      const groupsWithWorkspaces = response.data.map((groupWs: any) => ({
        groupId: groupWs.groupId,
        groupName: groupWs.groupName,
        workspaceId: groupWs.workspaceId,
        workspaceName: groupWs.workspaceName,
      }));
      const groups = groupsWithWorkspaces.map((g) => g.groupId);
      return { groupsWithWorkspaces, groups };
    } catch (error) {
      console.error('Error fetching groups:', error);
      return { success: false, message: 'Failed to fetch groups' };
    }
  }

  async fetchAndPrepareDocuments(userId: string) {
    const result = await this.fetchAllUserJoinedGroups(userId);

    if (Array.isArray(result) || 'success' in result) {
      console.error('Error fetching groups for documents:', result);
    } else {
      const { groupsWithWorkspaces, groups } = result;

      try {
        const allDocumentsData = await firstValueFrom(
          this.storageService.send(
            { cmd: 'get-resources-by-group-ids' },
            { groups },
          ),
        );

        if (!allDocumentsData.success) {
          console.error('Error fetching documents:', allDocumentsData);
          return { success: false, message: 'Failed to fetch documents' };
        }

        // getting documents under single workspace
        const workspaceDocumentsMap = new Map();

        groupsWithWorkspaces.forEach((g) => {
          const docs = allDocumentsData.data.filter(
            (doc: any) => doc.groupId === g.groupId,
          );

          if (!workspaceDocumentsMap.has(g.workspaceName)) {
            workspaceDocumentsMap.set(g.workspaceName, []);
          }

          if (docs.length > 0) {
            const formattedDocs = docs.map((d: any) => ({
              fileName: d.fileName,
              description: d.description,
              contentType: d.contentType,
              estimatedCompletionTime: d.estimatedCompletionTime,
              tags: d.tags.map((t: any) => t.tag),
            }));
            workspaceDocumentsMap.get(g.workspaceName).push(...formattedDocs);
          }
        });

        // Convert map to array format
        const workspaceWithDocuments = Array.from(
          workspaceDocumentsMap.entries(),
        ).map(([workspaceName, documents]) => ({
          workspaceName,
          documents: documents.length > 0 ? documents : 'No documents found',
        }));

        // console.log(workspaceWithDocuments)
        return workspaceWithDocuments;
      } catch (error) {
        console.error('Error fetching documents:', error);
        return { success: false, message: 'Failed to fetch documents' };
      }
    }
  }

  async fetchUserAttemptedQuizzes(userId: string) {
    try {
      const response = await firstValueFrom(
        this.quizService.send(
          { cmd: 'get_user_attempted_quizzes' },
          { userId },
        ),
      );
      if (!response.success) {
        return [];
      }
      const attemptedQuizzes = response.data.map((quizAttempt: any) => ({
        attempt_no: quizAttempt.attempt_no,
        score: quizAttempt.score,
        time_taken: quizAttempt.time_taken,
        quiz: {
          name: quizAttempt.quiz.title,
          description: quizAttempt.quiz.description,
          Deadline: quizAttempt.quiz.deadline,
        },
      }));

      // console.log(attemptedQuizzes);

      const result = await this.fetchAllUserJoinedGroups(userId);

      if (Array.isArray(result) || 'success' in result) {
        console.error('Error fetching groups for quizzes:', result);
        return attemptedQuizzes;
      }

      const { groupsWithWorkspaces } = result;

      //create a response with workspace name and all the quiz attempts under that workspace
      const workspaceQuizMap = new Map();
      attemptedQuizzes.forEach((quizAttempt: any) => {
        const group = groupsWithWorkspaces.find(
          (g) => g.groupId === quizAttempt.groupId,
        );
        if (group) {
          const workspaceName = group.workspaceName;
          if (!workspaceQuizMap.has(workspaceName)) {
            workspaceQuizMap.set(workspaceName, []);
          }
          workspaceQuizMap.get(workspaceName).push(quizAttempt);
        }
      });

      const attemptedQuizzesWithWorkspaces = Array.from(
        workspaceQuizMap.entries(),
      ).map(([workspaceName, quizzes]) => ({
        workspaceName,
        quizzes: quizzes.length > 0 ? quizzes : 'No quizzes attempted',
      }));

      return attemptedQuizzesWithWorkspaces;
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      return { success: false, message: 'Failed to fetch quizzes' };
    }
  }

  parseGeminiJSON = (text: string) => {
    try {
      // Remove code fences like ```json ... ```
      const cleaned = text
        .replace(/```(json)?/g, '') // remove ``` or ```json
        .trim();

      return JSON.parse(cleaned);
    } catch (err) {
      console.error('Invalid JSON from Gemini:', err, '\nRaw text:', text);
      return null; // fallback
    }
  };

  // -- Generate Flashcards
  async generateFlashcards(data: GenerateFlashcardsDto) {
    const { userId, resourceId, fileName, contentType, description, number } =
      data;
    this.logger.log(
      `Generating flashcards for user: ${userId}, file: ${resourceId}`,
    );

    try {
      // Get download URL from storage service
      const downloadUrlResponse = await lastValueFrom(
        this.storageService.send(
          { cmd: 'generate-download-url' },
          { resourceId },
        ),
      );

      if (!downloadUrlResponse?.downloadUrl) {
        throw new Error('Failed to generate download URL from storage service');
      }

      const fileUrl = downloadUrlResponse.downloadUrl;
      this.logger.log(`Downloading file from: ${fileUrl}`);

      // Download file content
      const fileBuffer = await this.downloadFromS3Url(fileUrl);
      this.logger.log(`Downloaded file, size: ${fileBuffer.length} bytes`);

      // Upload to Gemini File API
      const fileManager = this.gemini.getFileManager();

      // Create a temporary file path for upload
      const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${fileName}`);

      // Write buffer to temporary file
      fs.writeFileSync(tempFilePath, fileBuffer);

      const uploadResponse = await fileManager.uploadFile(tempFilePath, {
        mimeType: contentType,
        displayName: fileName,
      });

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      this.logger.log(`Uploaded to Gemini: ${uploadResponse.file.uri}`);

      // Generate flashcards using Gemini
      const model = this.gemini.getModel('gemini-2.0-flash');
      const prompt = `
        Generate exactly ${number} educational flashcards from the provided ${contentType} file named "${fileName}".
        
        Additional context: ${description}
        
        Create comprehensive flashcards that cover the key concepts, definitions, and important points from the content.
        
        Return the flashcards in the following JSON format:
        {
          "title": "Brief descriptive title for this flashcard set",
          "subject": "Main subject/topic area",
          "totalCards": ${number},
          "sourceFile": "${fileName}",
          "generatedAt": "${new Date().toISOString()}",
          "flashcards": [
            {
              "id": 1,
              "front": "Question or prompt text",
              "back": "Answer or explanation text"
            }
          ]
        }
        
        Make sure:
        - Generate exactly ${number} flashcards as requested
        - Use simple front/back format (question on front, answer on back)
        - Questions are clear and specific
        - Answers are accurate and educational
        - Cover different difficulty levels appropriately
        - Include various question types (definitions, explanations, applications)
        
        Return ONLY the JSON, no additional text.
      `;

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResponse.file.mimeType,
            fileUri: uploadResponse.file.uri,
          },
        },
        { text: prompt },
      ]);

      const responseText = result.response.text();
      this.logger.log(
        `Gemini response received, length: ${responseText.length}`,
      );

      // Parse the JSON response
      let flashcardsData = this.parseGeminiJSON(responseText);

      console.log(flashcardsData);

      if (!flashcardsData) {
        // Fallback if JSON parsing fails
        flashcardsData = {
          title: `Flashcards for ${fileName}`,
          subject: 'Generated Content',
          flashcards: [],
          totalCards: 0,
          sourceFile: fileName,
          generatedAt: new Date().toISOString(),
          rawResponse: responseText,
        };
      }

      // Save flashcards to database
      const flashcardEntity = this.flashcardRepository.create({
        title: flashcardsData.title || `Flashcards for ${fileName}`,
        subject: flashcardsData.subject || 'Generated Content',
        cardCount:
          flashcardsData.totalCards || flashcardsData.flashcards?.length || 0,
        flashcardContent: flashcardsData.flashcards || [],
        userId,
        resourceId,
      });

      const savedFlashcard =
        await this.flashcardRepository.save(flashcardEntity);
      this.logger.log(
        `Saved flashcard set with ID: ${savedFlashcard.flashcardId}`,
      );

      // Log analytics
      await lastValueFrom(
        this.analyticsClient.send(
          { cmd: 'log_user_activity' },
          {
            user_id: userId,
            category: 'AI_LEARNING',
            activity_type: 'GENERATED_FLASHCARDS',
            metadata: {
              flashcardId: savedFlashcard.flashcardId,
              resourceId,
              fileName,
              contentType,
              flashcardCount: savedFlashcard.cardCount,
              generatedAt: new Date().toISOString(),
            },
          },
        ),
      );

      // Clean up uploaded file from Gemini (optional)
      try {
        await fileManager.deleteFile(uploadResponse.file.name);
        this.logger.log(
          `Cleaned up uploaded file: ${uploadResponse.file.name}`,
        );
      } catch (cleanupError) {
        this.logger.warn(`Failed to cleanup file: ${cleanupError.message}`);
      }

      return {
        success: true,
        data: { ...savedFlashcard, fileName },
        message: 'Flashcards generated successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error generating flashcards: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        message: `Failed to generate flashcards: ${error.message}`,
        error: error.message,
      };
    }
  }

  // Helper method for downloading the flashcard
  private async downloadFromS3Url(presignedUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(presignedUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(
          `Failed to download file: ${response.status} ${response.statusText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error downloading from S3:', error);
      throw error;
    }
  }

  // Function to fetch the existing flashcards from the database
  async getFlashcardsByUser(userId: string) {
    try {
      this.logger.log(`Fetching flashcards for user: ${userId}`);

      const flashcards = await this.flashcardRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' }, // Most recent first
      });

      return {
        success: true,
        data: flashcards,
        message: 'Flashcards retrieved successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error fetching flashcards for user ${userId}: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: 'Failed to retrieve flashcards',
        error: error.message,
      };
    }
  }

  // Function to fetch a specific flashcard by ID and user
  async getFlashcardById(flashcardId: string, userId: string) {
    try {
      this.logger.log(`Fetching flashcard ${flashcardId} for user: ${userId}`);

      const flashcard = await this.flashcardRepository.findOne({
        where: { flashcardId, userId },
      });

      if (!flashcard) {
        return {
          success: false,
          message: 'Flashcard not found or access denied',
        };
      }

      return {
        success: true,
        data: flashcard,
        message: 'Flashcard retrieved successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error fetching flashcard ${flashcardId}: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: 'Failed to retrieve flashcard',
        error: error.message,
      };
    }
  }

  // Function to delete a flashcard
  async deleteFlashcard(flashcardId: string, userId: string) {
    try {
      this.logger.log(`Deleting flashcard ${flashcardId} for user: ${userId}`);

      const flashcard = await this.flashcardRepository.findOne({
        where: { flashcardId, userId },
      });

      if (!flashcard) {
        return {
          success: false,
          message: 'Flashcard not found or access denied',
        };
      }

      await this.flashcardRepository.remove(flashcard);

      // Log analytics
      await lastValueFrom(
        this.analyticsClient.send(
          { cmd: 'log_user_activity' },
          {
            user_id: userId,
            category: 'AI_LEARNING',
            activity_type: 'DELETED_FLASHCARDS',
            metadata: {
              flashcardId,
              title: flashcard.title,
              deletedAt: new Date().toISOString(),
            },
          },
        ),
      ).catch((analyticsError) => {
        this.logger.error(
          `Analytics logging failed: ${analyticsError.message}`,
        );
      });

      return {
        success: true,
        message: 'Flashcard deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error deleting flashcard ${flashcardId}: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: 'Failed to delete flashcard',
        error: error.message,
      };
    }
  }
}
