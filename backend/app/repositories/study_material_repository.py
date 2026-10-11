from sqlalchemy import or_

from app.extensions import db
from app.models.study_material_model import StudyMaterial
from app.models.subject_model import Subject
from app.models.topic_model import Topic


class StudyMaterialRepository:
    @staticmethod
    def find_subject(subject_id):
        return db.session.get(Subject, subject_id)

    @staticmethod
    def find_topic(topic_id):
        return db.session.get(Topic, topic_id)

    @staticmethod
    def create(data):
        material = StudyMaterial(**data)
        db.session.add(material)
        db.session.commit()
        return material

    @staticmethod
    def get_admin_materials(search, subject_id, topic_id, is_active, page, per_page):
        query = StudyMaterial.query.join(
            Subject, StudyMaterial.subject_id == Subject.id
        ).join(
            Topic, StudyMaterial.topic_id == Topic.id
        )
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(
                StudyMaterial.title.ilike(pattern),
                StudyMaterial.original_filename.ilike(pattern),
            ))
        if subject_id is not None:
            query = query.filter(StudyMaterial.subject_id == subject_id)
        if topic_id is not None:
            query = query.filter(StudyMaterial.topic_id == topic_id)
        if is_active is not None:
            query = query.filter(StudyMaterial.is_active == is_active)

        total = query.order_by(None).count()
        materials = query.order_by(StudyMaterial.created_at.desc(), StudyMaterial.id.desc()) \
            .offset((page - 1) * per_page).limit(per_page).all()
        return total, materials

    @staticmethod
    def find_by_id(material_id):
        return db.session.get(StudyMaterial, material_id)

    @staticmethod
    def get_active_by_topic(topic_id):
        return StudyMaterial.query.filter_by(
            topic_id=topic_id, is_active=True
        ).order_by(StudyMaterial.created_at.desc(), StudyMaterial.id.desc()).all()

    @staticmethod
    def update_status(material, is_active):
        material.is_active = is_active
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return material

    @staticmethod
    def delete(material):
        db.session.delete(material)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
