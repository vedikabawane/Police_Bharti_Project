from app import create_app
from app.extensions import db
from app.models import Subject


app = create_app()


subjects = [
    {
        "name": "Marathi",
        "description": "मराठी भाषा आणि व्याकरण"
    },
    {
        "name": "Mathematics",
        "description": "पोलीस भरतीसाठी गणित"
    },
    {
        "name": "Intelligence",
        "description": "बुद्धिमत्ता चाचणी"
    },
    {
        "name": "General Knowledge",
        "description": "सामान्य ज्ञान"
    },
    {
        "name": "Current Affairs",
        "description": "चालू घडामोडी"
    },
    {
        "name": "History",
        "description": "इतिहास"
    },
    {
        "name": "Geography",
        "description": "भूगोल"
    },
    {
        "name": "Political Science",
        "description": "राज्यशास्त्र"
    },
    {
        "name": "Science",
        "description": "विज्ञान"
    }
]


with app.app_context():

    for item in subjects:

        existing = Subject.query.filter_by(
            name=item["name"]
        ).first()

        if existing:
            print(
                f"Already exists: {item['name']}"
            )
            continue

        subject = Subject(
            name=item["name"],
            description=item["description"]
        )

        db.session.add(subject)

    db.session.commit()

    print("Subjects seeded successfully.")