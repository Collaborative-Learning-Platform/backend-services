import { Inject, Injectable } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { GenerateStudyPlanDto } from './dto/generateStudyPlanDto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyPlan } from './entity/study_plan.entity';
import { UpdateTaskCompletionDto } from './dto/updateTaskCompletion.dto';
import { BulkUpdateTaskCompletionDto } from './dto/bulkUpdateTaskCompletion.dto';
import { UpdateStudyTimeDto } from './dto/updateStudyTime.dto';

@Injectable()
export class AiMsService {
  constructor(private readonly gemini: GeminiProvider,
              @Inject('WORKSPACE_SERVICE') private readonly workspaceService: ClientProxy,
              @Inject('QUIZ_SERVICE') private readonly quizService: ClientProxy,
              @Inject('STORAGE_SERVICE') private readonly storageService: ClientProxy,
              @InjectRepository(StudyPlan) private studyPlanRepository: Repository<StudyPlan>

  ) {}

  async generateStudyPlan(data: GenerateStudyPlanDto) {
    // const workspaces = await this.fetchAndPrepareWorkspaces(data.userId);
    const filesUnderWorkspaces = await this.fetchAndPrepareDocuments(data.userId);
    const attemptedQuizzesWithWorkspaces = await this.fetchUserAttemptedQuizzes(data.userId);
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
    await this.studyPlanRepository.save(studyPlan);

    return {
      success: true,
      data: parsed,
      message: 'Study plan generated successfully',
    };

  }


  async getStudyPlan(userId: string) {
    const studyPlan = await this.studyPlanRepository.findOne({ where: { userId } });
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
    const studyPlan = await this.studyPlanRepository.findOne({ where: { userId } });
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
    const studyPlan = await this.studyPlanRepository.findOne({ where: { userId } });
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


  async updateStudyTime(data: UpdateStudyTimeDto){
    const { userId, actualStudyTime, dayName } = data;
    const studyPlan = await this.studyPlanRepository.findOne({ where: { userId } });
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
    try{
      const allWorkspacesData = await firstValueFrom(this.workspaceService.send({ cmd: 'get_workspaces_by_user' }, { userId }));
      const workspaces = allWorkspacesData.data.map((ws:any) => ({
        name: ws.name,
        description : ws.description,
      }));
      
      return workspaces;
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      return { success: false, message: 'Failed to fetch workspaces' };
    }
  }

  
  async fetchAllUserJoinedGroups(userId: string) {
    try{
      const response = await firstValueFrom(this.workspaceService.send({ cmd: 'get_groups_by_user' }, { userId }));
      if(!response.success){
        return [];
      }
      const groupsWithWorkspaces = response.data.map((groupWs:any) => ({
        groupId: groupWs.groupId,
        groupName: groupWs.groupName,
        workspaceId: groupWs.workspaceId,
        workspaceName: groupWs.workspaceName,
      }));
      const groups = groupsWithWorkspaces.map(g => g.groupId);
      return {groupsWithWorkspaces, groups};
    } catch (error) {
      console.error('Error fetching groups:', error);
      return { success: false, message: 'Failed to fetch groups' };
    }
  }


  async fetchAndPrepareDocuments(userId: string) {
    const result = await this.fetchAllUserJoinedGroups(userId);
    
    
    if (Array.isArray(result) || 'success' in result) {
      console.error('Error fetching groups for documents:', result);
    } 
    else {
      const {groupsWithWorkspaces, groups} = result;

      try{
        const allDocumentsData = await firstValueFrom(this.storageService.send({ cmd: 'get-resources-by-group-ids' }, { groups }));
       
        if(!allDocumentsData.success){
         
          console.error('Error fetching documents:', allDocumentsData);
          return { success: false, message: 'Failed to fetch documents' };
        
        }
        
        // getting documents under single workspace
        const workspaceDocumentsMap = new Map();
        
        groupsWithWorkspaces.forEach(g => {
          const docs = allDocumentsData.data.filter((doc:any) => doc.groupId === g.groupId);
          
          if (!workspaceDocumentsMap.has(g.workspaceName)) {
            workspaceDocumentsMap.set(g.workspaceName, []);
          }
          
          if (docs.length > 0) {
            const formattedDocs = docs.map((d:any) => ({
              fileName: d.fileName,
              description: d.description,
              contentType: d.contentType,
              estimatedCompletionTime: d.estimatedCompletionTime,
              tags: d.tags.map((t:any) => t.tag),
            }));
            workspaceDocumentsMap.get(g.workspaceName).push(...formattedDocs);
          }
        });
        
        // Convert map to array format
        const workspaceWithDocuments = Array.from(workspaceDocumentsMap.entries()).map(([workspaceName, documents]) => ({
          workspaceName,
          documents: documents.length > 0 ? documents : 'No documents found'
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
    try{
      const response = await firstValueFrom(this.quizService.send({ cmd: 'get_user_attempted_quizzes' }, { userId }));
      if(!response.success){
        return [];
      }
      const attemptedQuizzes = response.data.map((quizAttempt:any) => ({
          attempt_no: quizAttempt.attempt_no,
          score: quizAttempt.score,
          time_taken: quizAttempt.time_taken,
          quiz: { name: quizAttempt.quiz.title,
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
      attemptedQuizzes.forEach((quizAttempt:any) => {
        const group = groupsWithWorkspaces.find(g => g.groupId === quizAttempt.groupId);
        if (group) {
          const workspaceName = group.workspaceName;
          if (!workspaceQuizMap.has(workspaceName)) {
            workspaceQuizMap.set(workspaceName, []);
          }
          workspaceQuizMap.get(workspaceName).push(quizAttempt);
        }
      }
      );

      const attemptedQuizzesWithWorkspaces = Array.from(workspaceQuizMap.entries()).map(([workspaceName, quizzes]) => ({
        workspaceName,
        quizzes: quizzes.length > 0 ? quizzes : 'No quizzes attempted'
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
  }




}


