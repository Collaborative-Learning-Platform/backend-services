export class DocumentResponseDto {
  documentId: string;
  name: string;
  title: string;
  groupId: string;
  createdBy: string;
  lastEdited: Date;
}

export class ContributorResponseDto extends DocumentResponseDto {
  contributorIds: string[];
}
