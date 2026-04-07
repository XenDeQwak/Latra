import { Status } from '@prisma/client';

export class CreateCardDto {
    title!: string
    description!: string
    status?: Status
    deadline!: Date
    listId!: number
}
