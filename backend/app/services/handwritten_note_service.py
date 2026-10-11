from app.repositories.subject_repository import SubjectRepository
from app.repositories.topic_repository import TopicRepository
from app.repositories.handwritten_note_repository import (
    HandwrittenNoteRepository
)


class HandwrittenNoteService:

    @staticmethod
    def get_by_topic(topic_id: int):

        topic = TopicRepository.find_by_id(topic_id)

        if not topic:
            raise ValueError("Topic not found.")

        return HandwrittenNoteRepository.get_by_topic_id(
            topic_id
        )

    @staticmethod
    def create(
        subject_id: int,
        topic_id: int,
        data: dict
    ):

        subject = SubjectRepository.find_by_id(
            subject_id
        )

        if not subject:
            raise ValueError("Subject not found.")

        topic = TopicRepository.find_by_id(
            topic_id
        )

        if not topic:
            raise ValueError("Topic not found.")

        if topic.subject_id != subject_id:
            raise ValueError(
                "Topic does not belong to this subject."
            )

        return HandwrittenNoteRepository.create(
            subject_id,
            topic_id,
            data
        )

    @staticmethod
    def update(note_id: int, data: dict):

        note = HandwrittenNoteRepository.find_by_id(
            note_id
        )

        if not note:
            raise ValueError(
                "Handwritten note not found."
            )

        return HandwrittenNoteRepository.update(
            note,
            data
        )

    @staticmethod
    def delete(note_id: int):

        note = HandwrittenNoteRepository.find_by_id(
            note_id
        )

        if not note:
            raise ValueError(
                "Handwritten note not found."
            )

        HandwrittenNoteRepository.delete(note)