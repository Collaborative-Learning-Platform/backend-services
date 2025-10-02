export class MyDocumentsResponseDto {
  documentId: string;
  name: string;
  title: string;
  groupId: string;
  createdBy: string;
  lastEdited: string;
  contributorIds: string[];
  sizeInBytes: number;
}
