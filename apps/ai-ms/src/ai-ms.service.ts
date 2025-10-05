import { Inject, Injectable } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { GenerateStudyPlanDto } from './dto/generateStudyPlanDto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiMsService {
  constructor(private readonly gemini: GeminiProvider,
              @Inject('WORKSPACE_SERVICE') private readonly workspaceService: ClientProxy,
              @Inject('QUIZ_SERVICE') private readonly quizService: ClientProxy,
              @Inject('STORAGE_SERVICE') private readonly storageService: ClientProxy,

  ) {}

  async generateStudyPlan(data: GenerateStudyPlanDto) {
    // const workspaces = await this.fetchAndPrepareWorkspaces(data.userId);
    const filesUnderWorkspaces = await this.fetchAndPrepareDocuments(data.userId);
    const attempts = await this.fetchUserAttemptedQuizzes(data.userId);
    const model = this.gemini.getModel('gemini-2.0-flash'); 

    const prompt = `
      You are a study assistant.
      Generate a personalized study plan for user: .
      This for testing purpose only. give answer in json format.
      workspaces are like modules enrolled by the user and this contains list of workspaces that user has enrolled and details
      of resources under each workspace. ${filesUnderWorkspaces ? JSON.stringify(filesUnderWorkspaces) : 'No workspaces or documents found'}
      data is ${JSON.stringify(data)}

      
      
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
      Ensure the JSON is properly formatted.
    `;
    

    const result = await model.generateContent(prompt);

    let parsed = this.parseGeminiJSON(result.response.text());
    console.log(parsed)
    if (!parsed) {
      parsed = { raw: result.response.text() }; 
    }
    return {
      success: true,
      data: parsed,
    };

  }

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
      console.log(groups)

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
        
        console.log(workspaceWithDocuments)
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
      console.log(response.data);

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


