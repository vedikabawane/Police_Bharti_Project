"""Idempotently seed Police Bharti subjects and their canonical topics.

Run from the backend directory with:
    .\\venv\\Scripts\\python.exe seed_subjects.py
"""

from sqlalchemy import select
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import Subject, Topic


SUBJECTS = {
    "Marathi": {
        "description": "मराठी भाषा आणि व्याकरण",
        "topics": (
            "व्याकरण",
            "वर्णमाला, स्वर आणि व्यंजन",
            "नाम, सर्वनाम आणि विशेषण",
            "क्रियापद, काळ आणि प्रयोग",
            "लिंग, वचन आणि विभक्ती",
            "संधीचे प्रकार",
            "समास आणि त्यांचे प्रकार",
            "समानार्थी आणि विरुद्धार्थी शब्द",
            "वाक्प्रचार आणि म्हणी",
            "शुद्धलेखन आणि विरामचिन्हे",
        ),
    },
    "Mathematics": {
        "description": "पोलीस भरतीसाठी गणित",
        "topics": (
            "संख्या पद्धती आणि मूलभूत क्रिया",
            "लसावी आणि मसावी",
            "भिन्न, दशांश आणि टक्केवारी",
            "गुणोत्तर आणि प्रमाण",
            "सरासरी",
            "नफा, तोटा आणि सूट",
            "साधे आणि चक्रवाढ व्याज",
            "वेळ, वेग आणि अंतर",
            "काम आणि वेळ",
            "क्षेत्रफळ, परिमिती आणि घनफळ",
        ),
    },
    "Intelligence": {
        "description": "बुद्धिमत्ता चाचणी",
        "topics": (
            "अक्षरमाला आणि अक्षरमालिका",
            "संख्या मालिका",
            "सादृश्य आणि वर्गीकरण",
            "कोडिंग आणि डिकोडिंग",
            "दिशाज्ञान आणि अंतर",
            "रक्तसंबंध",
            "क्रमवारी आणि स्थान",
            "घड्याळ आणि दिनदर्शिका",
            "वेन आकृत्या",
            "बैठक व्यवस्था आणि तर्कनिष्कर्ष",
        ),
    },
    "General Knowledge": {
        "description": "सामान्य ज्ञान",
        "topics": (
            "भारताचा इतिहास",
            "महाराष्ट्राचा इतिहास आणि समाजसुधारक",
            "भारताचा भूगोल",
            "महाराष्ट्राचा भूगोल",
            "भारतीय राज्यघटना आणि प्रशासन",
            "महाराष्ट्र शासनव्यवस्था",
            "भारतीय अर्थव्यवस्था",
            "क्रीडा आणि पुरस्कार",
            "राष्ट्रीय प्रतीके आणि महत्त्वाची स्थळे",
            "पुस्तके, लेखक आणि सांस्कृतिक वारसा",
        ),
    },
    "Current Affairs": {
        "description": "चालू घडामोडी",
        "topics": (
            "राष्ट्रीय घडामोडी",
            "महाराष्ट्रातील चालू घडामोडी",
            "आंतरराष्ट्रीय घडामोडी",
            "शासकीय योजना आणि उपक्रम",
            "अर्थव्यवस्था आणि अर्थसंकल्प",
            "विज्ञान आणि तंत्रज्ञान",
            "पर्यावरण आणि हवामान",
            "क्रीडा स्पर्धा आणि पुरस्कार",
            "नियुक्त्या आणि महत्त्वाचे पदाधिकारी",
            "सन्मान आणि महत्त्वाचे दिनविशेष",
        ),
    },
    "History": {
        "description": "इतिहास",
        "topics": (
            "प्राचीन भारतातील संस्कृती आणि साम्राज्ये",
            "मध्ययुगीन भारतातील राजसत्ता",
            "आधुनिक भारतातील सामाजिक सुधारणा",
            "भारतीय स्वातंत्र्यलढा",
            "१८५७ चा उठाव",
            "महाराष्ट्रातील संतपरंपरा",
            "छत्रपती शिवाजी महाराज आणि स्वराज्य",
            "पेशवाई आणि मराठा साम्राज्य",
            "महाराष्ट्रातील समाजसुधारक",
            "स्वातंत्र्योत्तर भारत आणि महाराष्ट्र",
        ),
    },
    "Geography": {
        "description": "भूगोल",
        "topics": (
            "पृथ्वीची रचना आणि भौगोलिक घटक",
            "भारताचे भौगोलिक स्थान आणि सीमा",
            "महाराष्ट्राचे विभाग आणि जिल्हे",
            "नद्या, धरणे आणि जलसंपत्ती",
            "हवामान आणि पर्जन्य",
            "मृदा आणि नैसर्गिक वनस्पती",
            "शेती आणि प्रमुख पिके",
            "खनिजे आणि उद्योग",
            "लोकसंख्या आणि नागरीकरण",
            "राष्ट्रीय उद्याने आणि अभयारण्ये",
        ),
    },
    "Political Science": {
        "description": "राज्यशास्त्र",
        "topics": (
            "भारतीय राज्यघटनेची वैशिष्ट्ये",
            "प्रस्तावना आणि मूलभूत तत्त्वे",
            "मूलभूत हक्क, कर्तव्ये आणि मार्गदर्शक तत्त्वे",
            "केंद्र शासन: राष्ट्रपती आणि पंतप्रधान",
            "संसद आणि कायदेप्रक्रिया",
            "राज्य शासन: राज्यपाल आणि मुख्यमंत्री",
            "राज्य विधिमंडळ आणि मंत्रिमंडळ",
            "न्यायव्यवस्था आणि सर्वोच्च न्यायालय",
            "स्थानिक स्वराज्य संस्था",
            "निवडणूक आयोग आणि निवडणूक प्रक्रिया",
        ),
    },
    "Science": {
        "description": "विज्ञान",
        "topics": (
            "गती, बल आणि कार्य",
            "उष्णता, प्रकाश आणि ध्वनी",
            "विद्युत आणि चुंबकत्व",
            "पदार्थ आणि त्यांचे गुणधर्म",
            "अम्ल, आम्लारी आणि क्षार",
            "धातू, अधातू आणि मिश्रणे",
            "मानवी शरीर आणि आरोग्य",
            "पोषण आणि जीवनसत्त्वे",
            "वनस्पती आणि प्राणीशास्त्र",
            "पर्यावरण, प्रदूषण आणि जैवविविधता",
        ),
    },
}


class SeedDataError(ValueError):
    """Raised when seeding cannot preserve existing subject/topic data."""


def validate_seed_database(config):
    """Fail closed unless this is the configured local development database."""
    if config.get("APP_ENV") != "development":
        raise SeedDataError("Subject/topic seeding is allowed only in development.")
    if config.get("ADMIN_BOOTSTRAP_ENABLED"):
        raise SeedDataError(
            "Disable ADMIN_BOOTSTRAP_ENABLED before running the subject/topic seeder."
        )

    database_uri = config.get("SQLALCHEMY_DATABASE_URI")
    if not isinstance(database_uri, str) or not database_uri.strip():
        raise SeedDataError("DATABASE_URL must identify the local development database.")

    try:
        parsed = make_url(database_uri)
    except (ArgumentError, TypeError, ValueError):
        raise SeedDataError(
            "DATABASE_URL must identify the local development database."
        ) from None

    if (
        parsed.drivername != "mysql+pymysql"
        or parsed.host not in {"localhost", "127.0.0.1", "::1"}
        or parsed.database != "police_bharti_db"
    ):
        raise SeedDataError(
            "Seeder requires local MySQL database police_bharti_db."
        )


def seed_subjects_and_topics(session):
    """Create missing canonical records without overwriting existing content."""
    created_subjects = 0
    created_topics = 0
    reused_subjects = 0
    reused_topics = 0
    expected_subject_names = set(SUBJECTS)

    with session.begin():
        existing_subjects = session.scalars(
            select(Subject).order_by(Subject.id).with_for_update()
        ).all()
        unexpected_subjects = {
            subject.name for subject in existing_subjects
            if subject.name not in expected_subject_names
        }
        if unexpected_subjects:
            raise SeedDataError(
                "Unexpected subjects exist; refusing to remove or alter them."
            )

        subjects_by_name = {subject.name: subject for subject in existing_subjects}
        topics_by_subject = {}
        for subject_name, subject_data in SUBJECTS.items():
            subject = subjects_by_name.get(subject_name)
            if subject is None:
                continue
            existing_topics = session.scalars(
                select(Topic)
                .where(Topic.subject_id == subject.id)
                .order_by(Topic.id)
                .with_for_update()
            ).all()
            existing_names = [topic.name for topic in existing_topics]
            if len(existing_names) != len(set(existing_names)):
                raise SeedDataError(
                    f"Duplicate topics already exist under {subject_name}; "
                    "refusing to alter existing records."
                )
            unexpected_topics = set(existing_names) - set(subject_data["topics"])
            if unexpected_topics:
                raise SeedDataError(
                    f"Unexpected topics exist under {subject_name}; "
                    "refusing to remove or alter them."
                )
            topics_by_subject[subject.id] = set(existing_names)

        for subject_name, subject_data in SUBJECTS.items():
            subject = subjects_by_name.get(subject_name)
            if subject is None:
                subject = Subject(
                    name=subject_name,
                    description=subject_data["description"],
                )
                session.add(subject)
                session.flush()
                subjects_by_name[subject_name] = subject
                topics_by_subject[subject.id] = set()
                created_subjects += 1
            else:
                reused_subjects += 1

            existing_topic_names = topics_by_subject[subject.id]
            for topic_name in subject_data["topics"]:
                if topic_name in existing_topic_names:
                    reused_topics += 1
                    continue
                session.add(
                    Topic(
                        subject_id=subject.id,
                        name=topic_name,
                    )
                )
                created_topics += 1

        session.flush()
        final_subjects = session.scalars(select(Subject)).all()
        if len(final_subjects) != len(SUBJECTS):
            raise SeedDataError("Expected exactly 9 subjects after seeding.")
        for subject in final_subjects:
            topic_count = session.scalar(
                select(db.func.count())
                .select_from(Topic)
                .where(Topic.subject_id == subject.id)
            )
            if topic_count != 10:
                raise SeedDataError(
                    f"Subject {subject.name} must have exactly 10 topics."
                )
        total_topics = session.scalar(
            select(db.func.count()).select_from(Topic)
        )
        if total_topics != 90:
            raise SeedDataError("Expected exactly 90 topics after seeding.")

    return {
        "created_subjects": created_subjects,
        "created_topics": created_topics,
        "reused_subjects": reused_subjects,
        "reused_topics": reused_topics,
    }


def main():
    validate_seed_database({
        "APP_ENV": Config.APP_ENV,
        "ADMIN_BOOTSTRAP_ENABLED": Config.ADMIN_BOOTSTRAP_ENABLED,
        "SQLALCHEMY_DATABASE_URI": Config.SQLALCHEMY_DATABASE_URI,
    })

    app = create_app()
    with app.app_context():
        result = seed_subjects_and_topics(db.session)
        print(
            "Subject/topic seed complete: "
            f"{result['created_subjects']} subjects and "
            f"{result['created_topics']} topics created; "
            f"{result['reused_subjects']} subjects and "
            f"{result['reused_topics']} topics reused."
        )
        print("Verified final totals: 9 subjects, 90 topics, 10 per subject.")


if __name__ == "__main__":
    main()
