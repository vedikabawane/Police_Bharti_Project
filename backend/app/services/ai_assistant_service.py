import re
import unicodedata
from decimal import Decimal
from math import gcd
from uuid import uuid4

from app.config.config import Config
from app.repositories.ai_assistant_repository import AIAssistantRepository
from app.repositories.subject_repository import SubjectRepository
from app.services.question_service import QuestionService
from app.services.student_performance_service import (
    StudentPerformanceService
)


SUBJECT_ALIASES = {
    "mathematics": ("math", "maths", "mathematics", "गणित", "ganit"),
    "marathi": ("marathi", "मराठी"),
    "intelligence": (
        "intelligence", "reasoning", "बुद्धिमत्ता", "बुध्दीमत्ता",
        "buddhimatta", "buddhimatta"
    ),
    "history": ("history", "इतिहास", "itihas"),
    "geography": ("geography", "भूगोल", "bhugol"),
    "civics": ("civics", "political science", "राज्यशास्त्र", "rajyashastra"),
    "science": ("science", "विज्ञान", "vidnyan", "vignan"),
    "general_knowledge": (
        "general knowledge", "general awareness", "gk", "सामान्य ज्ञान",
        "samanya dnyan", "samanya gyan"
    ),
    "current_affairs": (
        "current affairs", "current events", "चालू घडामोडी",
        "chalu ghadamodi"
    ),
}

SUBJECT_LABELS = {
    "mathematics": "गणित",
    "marathi": "मराठी",
    "intelligence": "बुद्धिमत्ता",
    "history": "इतिहास",
    "geography": "भूगोल",
    "civics": "राज्यशास्त्र",
    "science": "विज्ञान",
    "general_knowledge": "सामान्य ज्ञान",
    "current_affairs": "चालू घडामोडी",
}

STOP_WORDS = {
    "my", "me", "is", "are", "am", "a", "an", "the", "of", "for", "to",
    "in", "on", "and", "or", "what", "how", "which", "tell", "about",
    "please", "have", "has", "do", "does", "i", "we", "you", "माझा",
    "माझी", "माझे", "माझ्या", "मला", "काय", "कसे", "कशी", "कोणते",
    "कोणता", "आहे", "आहेत", "सांगा", "सांग", "बद्दल", "किती", "का",
    "करू", "करायचे", "मी", "माझे"
}

WEAK_TERMS = (
    "weak", "weaker", "weakest", "कमजोर", "कमकुवत", "कमजोरी",
    "kamjor", "kamzor", "kaccha", "kacchi"
)
STRONG_TERMS = (
    "strong", "stronger", "मजबूत", "चांगला", "चांगली", "changla",
    "changli", "best subject"
)
MY_TERMS = (
    "my", "माझा", "माझी", "माझे", "माझ्या", "maza", "majha", "mazi",
    "mazya", "मी", "mi"
)
FOLLOW_UP_TERMS = (
    "त्यासाठी", "त्यावर", "त्याचा", "त्याची", "tyasathi", "tyavar",
    "for that", "about that", "daily plan", "study plan"
)


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).casefold()
    normalized = re.sub(r"[^\w%+\-*/:.=]+", " ", normalized, flags=re.UNICODE)
    return re.sub(r"\s+", " ", normalized).strip()


def _contains(text: str, terms) -> bool:
    for term in terms:
        normalized_term = normalize_text(term)
        if normalized_term.isascii():
            if re.search(
                rf"(?<![a-z0-9_]){re.escape(normalized_term)}(?![a-z0-9_])",
                text
            ):
                return True
        elif normalized_term and normalized_term in text:
            return True
    return False


def _detected_subject(text: str):
    for subject_key, aliases in SUBJECT_ALIASES.items():
        if _contains(text, aliases):
            return subject_key
    return None


def _subject_name_matches(subject_name: str, subject_key: str) -> bool:
    normalized_name = normalize_text(subject_name)
    if _contains(normalized_name, SUBJECT_ALIASES[subject_key]):
        return True
    english_names = {
        "mathematics": ("mathematics", "math", "maths"),
        "intelligence": ("intelligence", "reasoning", "mental ability"),
        "general_knowledge": ("general knowledge", "general awareness", "gk"),
        "current_affairs": ("current affairs", "current events"),
    }
    return _contains(normalized_name, english_names.get(subject_key, ()))


def _expanded_search_terms(message: str, subject_key=None):
    terms = [
        token for token in re.findall(r"[^\W_]+", normalize_text(message))
        if len(token) >= 2 and token not in STOP_WORDS
    ]
    if subject_key:
        terms.extend(SUBJECT_ALIASES.get(subject_key, ()))
    return list(dict.fromkeys(terms))[:24]


class IntentDetector:
    @staticmethod
    def classify(message: str, context=""):
        text = normalize_text(message)
        context_text = normalize_text(context)
        subject = _detected_subject(text)
        if not subject and _contains(text, FOLLOW_UP_TERMS):
            subject = _detected_subject(context_text)

        personalized = _contains(text, MY_TERMS) or _contains(
            text,
            ("my performance", "माझी performance", "माझे performance")
        )
        weak = _contains(text, WEAK_TERMS)
        strong = _contains(text, STRONG_TERMS)
        topic_word = _contains(text, ("topic", "topics", "टॉपिक", "विषय"))
        subject_word = _contains(text, ("subject", "विषय", "subjects"))

        if re.fullmatch(r"(?:नमस्कार|नमस्ते|hello|hi|hey)[!. ]*", text):
            return "GREETING", subject
        math_cues = (
            "calculate", "solve", "what is", "किती", "बेरीज", "वजाबाकी",
            "गुणाकार", "भागाकार", "जमा", "गणित"
        )
        has_percentage = re.search(
            r"(?<![\w.])\d+(?:\.\d+)?\s*%\s*"
            r"(?:(?:of|चा|ची|चे|चं|पैकी)\s*\d+(?:\.\d+)?|"
            r"(?:=|is|बराबर)\s*\d+(?:\.\d+)?)",
            text
        )
        has_arithmetic = re.search(
            r"(?<![\w.])-?\d+(?:\.\d+)?\s*[+\-*/×÷]\s*-?\d+(?:\.\d+)?(?![\w.])",
            text
        )
        bare_expression = re.fullmatch(
            r"\s*(?:(?:math|गणित)\s+)?-?\d+(?:\.\d+)?"
            r"\s*[+\-*/×÷]\s*-?\d+(?:\.\d+)?\s*",
            text
        )
        if has_percentage or (
            has_arithmetic
            and (_contains(text, math_cues) or bare_expression)
        ):
            return "MATH", subject

        if weak and subject:
            return "WEAK_SUBJECT", subject
        if strong and subject:
            return "STRONG_SUBJECT", subject
        if weak and topic_word:
            return "WEAK_TOPIC", subject
        if strong and topic_word:
            return "STRONG_TOPIC", subject
        if weak and (subject_word or personalized):
            return "WEAK_SUBJECTS", subject
        if strong and (subject_word or personalized):
            return "STRONG_SUBJECTS", subject

        if subject and _contains(text, ("accuracy", "अचूकता", "performance", "कामगिरी", "score", "marks", "गुण")):
            return "SUBJECT_STATISTICS", subject

        if _contains(text, ("current affairs", "चालू घडामोडी", "current events")):
            return "CURRENT_AFFAIRS", "current_affairs"
        if _contains(text, ("pyq", "previous year", "मागील वर्ष", "जुने प्रश्न")):
            return "PYQ", subject
        if _contains(text, (
            "किती tests", "किती test", "किती चाचण्या", "tests दिल्या",
            "test दिल्या", "tests completed", "tests taken", "test count",
            "how many tests", "tests have i completed", "did i take",
            "kiti test", "kiti tests", "mi kiti test dilya"
        )):
            return "TEST_COUNT", subject
        if _contains(text, ("average score", "सरासरी score", "average marks", "सरासरी गुण")):
            return "AVERAGE_SCORE", subject
        if _contains(text, ("best score", "highest score", "सर्वोत्तम score", "best marks")):
            return "BEST_SCORE", subject
        if _contains(text, ("accuracy", "अचूकता")):
            return "ACCURACY", subject
        if _contains(text, ("improve", "improved", "improvement", "progress", "सुधारली", "सुधारणा", "प्रगती")) and personalized:
            return "SCORE_PROGRESS", subject
        if _contains(text, ("history", "मागील test", "अलीकडील test", "test history")):
            return "TEST_HISTORY", subject
        if _contains(text, ("performance", "कामगिरी", "score", "marks", "गुण", "टक्केवारी")) and personalized:
            return "PERFORMANCE", subject

        if _contains(text, (
            "latest weight", "माझे वजन", "माझा weight", "running performance",
            "माझे running", "माझी running", "माझा 1600", "माझी physical",
            "my physical performance", "physical record", "mazya 1600",
            "maza 1600", "mazhe running", "majha running"
        )):
            return "PHYSICAL_PERFORMANCE", subject
        if _contains(text, MY_TERMS) and _contains(
            text,
            (
                "weight", "running", "1600", "1600m", "800", "800m",
                "100m", "push up", "long jump", "shot put"
            )
        ):
            return "PHYSICAL_PERFORMANCE", subject

        if _contains(text, ("1600", "running", "run", "धावणे", "धावण्याचा", "physical", "शारीरिक")):
            if _contains(text, ("improve", "सुधार", "कशी", "कसे", "plan", "तयारी", "practice", "सराव")):
                return "PHYSICAL_PREPARATION", subject

        if _contains(text, ("study plan", "daily plan", "timetable", "prepare for", "अभ्यास योजना", "अभ्यास आराखडा", "वेळापत्रक", "daily study", "तयारी कशी", "अभ्यास कसा", "कसा अभ्यास")):
            return "STUDY_PLAN", subject
        if _contains(text, ("गणिताचा अभ्यास", "math practice", "math kasa", "ganit kasa", "percentage kasa", "गणित कसे", "solve", "कसे करू")) and subject == "mathematics":
            return "SUBJECT_GUIDANCE", subject
        if subject:
            if subject == "current_affairs":
                return "CURRENT_AFFAIRS", subject
            if _contains(text, ("अभ्यास", "practice", "सराव", "improve", "सुधार", "कसा", "कशी", "how to")):
                return "SUBJECT_GUIDANCE", subject
            if _contains(text, ("काय", "कोणते", "important", "महत्त्वाचे", "विषय", "subject")):
                return "SUBJECT_INFORMATION", subject
            return "SUBJECT_CONTENT", subject

        if _contains(text, ("physical preparation", "शारीरिक तयारी", "running", "धावणे", "व्यायाम")):
            return "PHYSICAL_PREPARATION", subject
        if _contains(text, ("police bharti", "पोलीस भरती", "police recruitment", "भरतीची तयारी")):
            return "GENERAL_POLICE_BHARTI", subject

        return "UNKNOWN", subject


class AIProvider:

    def generate_response(self, user_id: int, message: str, context="") -> str:
        raise NotImplementedError


class DatabaseFallbackProvider(AIProvider):

    def generate_response(self, user_id: int, message: str, context="") -> str:
        intent, subject = IntentDetector.classify(message, context)

        if intent == "GREETING":
            return (
                "नमस्कार! पोलीस भरतीची तयारी, विषयांचा अभ्यास, PYQ, "
                "तुमची test performance किंवा physical सरावाबद्दल विचारा."
            )
        if intent == "MATH":
            return self._safe_math_answer(message) or (
                "कृपया सोडवायचे गणिती उदाहरण स्पष्ट लिहा."
            )
        if intent in ("WEAK_SUBJECT", "STRONG_SUBJECT"):
            return self._single_subject_performance(user_id, subject, intent)
        if intent in ("WEAK_SUBJECTS", "STRONG_SUBJECTS"):
            return self._subject_classifications(user_id, intent)
        if intent in ("WEAK_TOPIC", "STRONG_TOPIC"):
            return self._topic_classifications(user_id, intent)
        if intent == "SUBJECT_STATISTICS":
            return self._subject_statistics(user_id, subject)
        if intent in ("TEST_COUNT", "AVERAGE_SCORE", "BEST_SCORE", "ACCURACY", "PERFORMANCE", "SCORE_PROGRESS"):
            return self._test_statistics(user_id, intent)
        if intent == "TEST_HISTORY":
            return self._test_history(user_id)
        if intent == "PHYSICAL_PERFORMANCE":
            return self._physical_performance(user_id, message)
        if intent == "PHYSICAL_PREPARATION":
            return self._physical_guidance()
        if intent == "PYQ":
            return self._pyq_answer(message, subject)
        if intent == "CURRENT_AFFAIRS":
            return self._current_affairs_answer(message)
        if intent == "STUDY_PLAN":
            if not subject and _contains(normalize_text(message), FOLLOW_UP_TERMS):
                subject = _detected_subject(normalize_text(context))
            return self._study_plan(subject)
        if intent == "SUBJECT_GUIDANCE":
            return self._study_plan(subject)
        if intent in ("SUBJECT_INFORMATION", "SUBJECT_CONTENT", "GENERAL_POLICE_BHARTI"):
            return self._database_or_general_answer(message, subject)
        return (
            "मी महाराष्ट्र पोलीस भरतीची तयारी, अभ्यास-विषय, PYQ, test "
            "performance आणि physical सराव याबद्दल मदत करू शकतो. "
            "कृपया यापैकी एखाद्या विषयाबद्दल विचारा."
        )

    @staticmethod
    def _minimum_questions():
        return int(Config.PERFORMANCE_MIN_TOPIC_QUESTIONS)

    @staticmethod
    def _threshold():
        return float(Config.PERFORMANCE_STRONG_ACCURACY_THRESHOLD)

    @staticmethod
    def _subject_rows(user_id):
        return StudentPerformanceService.get_subject_performance(user_id)

    @classmethod
    def _single_subject_performance(cls, user_id, subject_key, intent):
        if not subject_key:
            return "कोणत्या विषयाची performance जाणून घ्यायची ते सांगा."
        subjects = cls._subject_rows(user_id)
        row = next(
            (
                item for item in subjects
                if _subject_name_matches(item["subject_name"], subject_key)
            ),
            None
        )
        if not row:
            return (
                f"{SUBJECT_LABELS[subject_key]} या विषयाची नोंद "
                "प्लॅटफॉर्ममध्ये उपलब्ध नाही."
            )
        minimum = cls._minimum_questions()
        threshold = cls._threshold()
        if row["questions_attempted"] < minimum or row["accuracy"] is None:
            return (
                f"{SUBJECT_LABELS[subject_key]} च्या performance बद्दल "
                f"अजून पुरेसा data नाही. वर्गीकरणासाठी किमान {minimum} "
                "attempted प्रश्न आवश्यक आहेत."
            )

        is_weak = row["accuracy"] < threshold
        classified_weak = intent == "WEAK_SUBJECT"
        if is_weak != classified_weak:
            status = "तुलनेने मजबूत" if not is_weak else "कमकुवत"
            lead = (
                f"नाही, सध्याच्या नोंदीनुसार {SUBJECT_LABELS[subject_key]} "
                f"कमकुवत नाही; तो {status} दिसतो."
                if classified_weak
                else f"{SUBJECT_LABELS[subject_key]} हा सध्या {status} दिसतो."
            )
        else:
            lead = (
                f"हो, सध्याच्या test performance नुसार "
                f"{SUBJECT_LABELS[subject_key]} तुलनेने कमजोर दिसतो."
                if is_weak
                else f"{SUBJECT_LABELS[subject_key]} सध्या मजबूत दिसतो."
            )

        return (
            f"{lead}\n\n📊 तुमची नोंद:\n"
            f"• Attempted प्रश्न: {row['questions_attempted']}\n"
            f"• Accuracy: {row['accuracy']:.1f}%\n"
            f"• Score: {row['score']:.2f}\n"
            f"• बरोबर: {row['correct']} · चुकीचे: {row['wrong']}\n\n"
            "📚 पुढची पायरी:\n"
            "• चुकीचे प्रश्न पुन्हा सोडवून त्यामागची संकल्पना उजळा.\n"
            "• नियमित topic-wise सराव करून पुढील चाचण्यांशी तुलना करा."
        )

    @classmethod
    def _subject_statistics(cls, user_id, subject_key):
        if not subject_key:
            return "कोणत्या विषयाची performance जाणून घ्यायची ते सांगा."
        subjects = cls._subject_rows(user_id)
        row = next(
            (
                item for item in subjects
                if _subject_name_matches(item["subject_name"], subject_key)
            ),
            None
        )
        if not row:
            return (
                f"{SUBJECT_LABELS[subject_key]} या विषयाची नोंद "
                "प्लॅटफॉर्ममध्ये उपलब्ध नाही."
            )
        if not row["questions_attempted"]:
            return (
                f"{SUBJECT_LABELS[subject_key]} साठी तुमची test performance "
                "अद्याप उपलब्ध नाही."
            )
        accuracy = (
            f"{row['accuracy']:.1f}%"
            if row["accuracy"] is not None else "उपलब्ध नाही"
        )
        percentage = (
            f"{row['percentage']:.1f}%"
            if row["percentage"] is not None else "उपलब्ध नाही"
        )
        return (
            f"{SUBJECT_LABELS[subject_key]} ची तुमची performance:\n"
            f"• Accuracy: {accuracy}\n"
            f"• Score: {row['score']:.2f} · Percentage: {percentage}\n"
            f"• Attempted प्रश्न: {row['questions_attempted']} "
            f"({row['correct']} बरोबर, {row['wrong']} चुकीचे)"
        )

    @classmethod
    def _subject_classifications(cls, user_id, intent):
        subjects = cls._subject_rows(user_id)
        minimum = cls._minimum_questions()
        threshold = cls._threshold()
        strong = []
        weak = []
        insufficient = []

        for row in subjects:
            if row["questions_attempted"] < minimum or row["accuracy"] is None:
                insufficient.append(row)
            elif row["accuracy"] >= threshold:
                strong.append(row)
            else:
                weak.append(row)

        selected = weak if intent == "WEAK_SUBJECTS" else strong
        label = "कमजोर" if intent == "WEAK_SUBJECTS" else "मजबूत"
        lines = [f"तुमच्या सध्याच्या चाचणी डेटानुसार {label} विषय:"]
        if selected:
            lines.extend(
                f"• {row['subject_name']} — accuracy {row['accuracy']:.1f}%, "
                f"{row['questions_attempted']} attempted प्रश्न"
                for row in selected
            )
        else:
            lines.append(f"• पुरेशा डेटावरून कोणताही {label} विषय आढळला नाही.")
        if insufficient:
            names = ", ".join(row["subject_name"] for row in insufficient)
            lines.append(
                f"\nअजून पुरेसा data नाही (किमान {minimum} प्रश्न आवश्यक): {names}."
            )
        lines.append(
            f"\nवर्गीकरणाचा नियम: accuracy {threshold:.0f}% "
            f"{'किंवा अधिक' if intent == 'STRONG_SUBJECTS' else 'पेक्षा कमी'}; "
            f"किमान {minimum} attempted प्रश्न."
        )
        if intent == "WEAK_SUBJECTS":
            weak_topics = StudentPerformanceService.get_strengths(user_id)[
                "weak_topics"
            ]
            if weak_topics:
                lines.append("\nकमकुवत topics:")
                lines.extend(
                    f"• {topic['subject_name']} – {topic['topic_name']}: "
                    f"accuracy {topic['accuracy']:.1f}%"
                    for topic in weak_topics
                )
        return "\n".join(lines)

    @staticmethod
    def _topic_classifications(user_id, intent):
        strengths = StudentPerformanceService.get_strengths(user_id)
        weak = strengths["weak_topics"]
        strong = strengths["strong_topics"]
        insufficient = strengths["insufficient_data_topics"]
        is_weak = intent == "WEAK_TOPIC"
        selected = weak if is_weak else strong
        label = "लक्ष देण्यासारखे कमजोर" if is_weak else "मजबूत"
        lines = [f"तुमच्या चाचणी डेटानुसार {label} topics:"]
        if selected:
            lines.extend(
                f"• {topic['subject_name']} — {topic['topic_name']}: "
                f"accuracy {topic['accuracy']:.1f}% "
                f"({topic['questions_attempted']} प्रश्न)"
                for topic in selected
            )
        else:
            lines.append("• पुरेशा डेटावरून असे topics सध्या आढळले नाहीत.")
        if insufficient:
            lines.append(
                f"\n{len(insufficient)} topics साठी अजून पुरेसा data नाही; "
                f"किमान {strengths['minimum_questions']} attempted प्रश्न आवश्यक."
            )
        if is_weak and selected:
            lines.append("\n• या topics वर नियमित प्रश्न सोडवा आणि चुकांची उजळणी करा.")
        if selected:
            lines = [line.replace(" — ", " – ") for line in lines]
        return "\n".join(lines)

    @staticmethod
    def _test_statistics(user_id, intent):
        overview = StudentPerformanceService.get_overview(user_id)
        if not overview["completed_tests"]:
            return "तुमची पूर्ण केलेली test अद्याप उपलब्ध नाही; निकाल नोंदल्यावर येथे दिसेल."

        if intent == "TEST_COUNT":
            return (
                f"तुम्ही {overview['completed_tests']} tests पूर्ण केल्या आहेत. "
                f"एकूण वेगळ्या tests: {overview['total_tests']}."
            )
        if intent == "AVERAGE_SCORE":
            value = overview["average_score"]
            return (
                f"तुमचा सरासरी score {value:.2f} आहे."
                if value is not None else "सरासरी score उपलब्ध नाही."
            )
        if intent == "BEST_SCORE":
            value = overview["best_score"]
            return (
                f"तुमचा सर्वोत्तम score {value:.2f} आहे."
                if value is not None else "सर्वोत्तम score उपलब्ध नाही."
            )
        if intent == "ACCURACY":
            value = overview["overall_accuracy"]
            return (
                f"तुमची एकूण accuracy {value:.1f}% आहे "
                f"({overview['total_correct']} बरोबर / "
                f"{overview['total_questions_attempted']} attempted प्रश्न)."
                if value is not None else "Accuracy मोजण्यासाठी attempted उत्तरांची माहिती उपलब्ध नाही."
            )
        if intent == "SCORE_PROGRESS":
            progress = StudentPerformanceService.get_progress(user_id)
            if len(progress) < 2:
                return "कामगिरीतील बदल सांगण्यासाठी किमान दोन पूर्ण चाचण्यांचा data आवश्यक आहे."
            change = overview["improvement_percentage"]
            if change is None:
                return "कामगिरीतील बदल सध्या मोजता येत नाही."
            if change > 0:
                return f"पहिल्या आणि अलीकडील test मधील percentage {change:.1f} percentage points ने वाढली आहे."
            if change < 0:
                return f"पहिल्या आणि अलीकडील test मधील percentage {abs(change):.1f} percentage points ने कमी झाली आहे."
            return "पहिल्या आणि अलीकडील test मधील percentage समान आहे."
        average_score = overview["average_score"]
        average_percentage = overview["average_percentage"]
        accuracy = overview["overall_accuracy"]
        best_score = overview["best_score"]
        return "\n".join((
            f"तुम्ही {overview['completed_tests']} tests पूर्ण केल्या आहेत.",
            (
                f"• सरासरी score: {average_score:.2f}"
                if average_score is not None
                else "• सरासरी score: उपलब्ध नाही"
            ),
            (
                f"• सरासरी percentage: {average_percentage:.1f}%"
                if average_percentage is not None
                else "• सरासरी percentage: उपलब्ध नाही"
            ),
            (
                f"• Accuracy: {accuracy:.1f}%"
                if accuracy is not None
                else "• Accuracy: उपलब्ध नाही"
            ),
            (
                f"• सर्वोत्तम score: {best_score:.2f}"
                if best_score is not None
                else "• सर्वोत्तम score: उपलब्ध नाही"
            ),
        ))

    @staticmethod
    def _test_history(user_id):
        history = StudentPerformanceService.get_test_history(user_id)
        if not history:
            return "तुमची पूर्ण केलेली test history उपलब्ध नाही."
        latest = history[0]
        return (
            f"तुमची अलीकडील test “{latest['test_name']}” "
            f"({latest['date']}) होती.\n"
            f"• Score: {latest['score']} · Percentage: {latest['percentage']}%\n"
            f"• बरोबर: {latest['correct']} · चुकीचे: {latest['wrong']} · "
            f"Skip: {latest['skipped']}"
        )

    @staticmethod
    def _physical_performance(user_id, message):
        data = StudentPerformanceService.get_physical_performance(user_id)
        latest = data["latest"]
        if not latest:
            return "तुमची physical training नोंद उपलब्ध नाही. नोंद जोडल्यानंतर तिचा आढावा घेता येईल."
        text = normalize_text(message)
        if _contains(text, ("weight", "वजन")):
            value = data["latest_weight"]
            return (
                f"तुमचे नवीनतम नोंदवलेले वजन {value} आहे."
                if value is not None else "नवीनतम नोंदीत वजन उपलब्ध नाही."
            )
        if _contains(text, (
            "running", "run", "धावणे", "1600", "1600m", "800", "800m", "100m"
        )):
            values = [
                (label, latest[key])
                for key, label in (
                    ("running_distance", "धावण्याचे अंतर"),
                    ("running_time", "धावण्याची वेळ"),
                    ("run_100m", "100m"),
                    ("run_800m", "800m"),
                    ("run_1600m", "1600m"),
                )
                if latest.get(key) is not None
            ]
            if not values:
                return "तुमच्या नवीनतम physical नोंदीत धावण्याची मोजमापे उपलब्ध नाहीत."
            return "तुमची नवीनतम धावण्याची नोंद:\n" + "\n".join(
                f"• {label}: {value}" for label, value in values
            )
        metrics = [
            ("वजन", latest["weight"]),
            ("धावण्याचे अंतर", latest["running_distance"]),
            ("धावण्याची वेळ", latest["running_time"]),
            ("100m", latest["run_100m"]),
            ("800m", latest["run_800m"]),
            ("1600m", latest["run_1600m"]),
            ("लांब उडी", latest["long_jump"]),
            ("गोळाफेक", latest["shot_put"]),
            ("पुश-अप्स", latest["push_ups"]),
        ]
        lines = [f"तुमची नवीनतम physical नोंद ({latest['date']}):"]
        lines.extend(f"• {label}: {value}" for label, value in metrics if value is not None)
        return "\n".join(lines)

    @staticmethod
    def _physical_guidance():
        return (
            "1600 मीटर धावण्याच्या तयारीसाठी सर्वसाधारण सूचना:\n"
            "• सुरुवातीला आरामदायी वेगात धावा आणि अंतर हळूहळू वाढवा.\n"
            "• आठवड्यात काही दिवस वेगाचे छोटे interval आणि काही दिवस हलकी धाव ठेवा.\n"
            "• धावण्यापूर्वी warm-up, नंतर cool-down आणि विश्रांती घ्या.\n"
            "• वेदना किंवा चक्कर आल्यास थांबा आणि आरोग्यतज्ज्ञांचा सल्ला घ्या.\n"
            "अधिकृत चाचणीचे निकष संबंधित भरती जाहिरातीतून तपासा."
        )

    @staticmethod
    def _study_plan(subject):
        label = SUBJECT_LABELS.get(subject)
        if subject == "mathematics":
            return (
                "गणितासाठी रोजचा सराव:\n"
                "• 15–20 मिनिटे सूत्रे आणि आधीच्या चुका उजळा.\n"
                "• एक संकल्पना समजून त्यावर उदाहरणे सोडवा.\n"
                "• वेळ लावून प्रश्न सोडवा आणि चुकांचे कारण लिहा.\n"
                "• आठवड्यातून एक timed test देऊन निकाल तपासा."
            )
        if subject == "marathi":
            return (
                "मराठी सुधारण्यासाठी:\n"
                "• रोज व्याकरणातील एक नियम उदाहरणांसह उजळा.\n"
                "• शब्दसंग्रह आणि वाचनाचा नियमित सराव करा.\n"
                "• व्याकरण/भाषावापराचे प्रश्न सोडवून चुका नोंदवा.\n"
                "• आठवड्यातून एक timed सराव संच पूर्ण करा."
            )
        if subject == "intelligence":
            return (
                "बुद्धिमत्ता विषयासाठी:\n"
                "• एका वेळी एक प्रश्नप्रकार निवडून नियम समजून घ्या.\n"
                "• सोप्या प्रश्नांपासून वेळबद्ध सरावाकडे जा.\n"
                "• चुकलेल्या प्रश्नांची पद्धत पुन्हा तपासा.\n"
                "• नियमित mixed practice करून वेळेची नोंद ठेवा."
            )
        if subject in ("history", "geography", "civics", "science", "general_knowledge"):
            return (
                f"{label} साठी:\n"
                "• एका topic चे छोटे भाग करून समजून वाचा.\n"
                "• स्वतःच्या शब्दांत संक्षिप्त नोंदी करा.\n"
                "• वाचल्यानंतर प्रश्न सोडवून आठवण तपासा.\n"
                "• चुकलेले मुद्दे ठराविक अंतराने पुन्हा उजळा."
            )
        return (
            "दैनिक अभ्यास आराखडा:\n"
            "• उपलब्ध वेळ विषयांमध्ये विभागून छोट्या अभ्यास सत्रांत काम करा.\n"
            "• नवीन संकल्पना, प्रश्नांचा सराव आणि उजळणी यांचा समतोल ठेवा.\n"
            "• चुकांची वही ठेवा आणि नियमित timed test द्या.\n"
            "• शारीरिक सराव हळूहळू वाढवा आणि विश्रांतीसाठी वेळ ठेवा."
        )

    @staticmethod
    def _safe_math_answer(message):
        text = normalize_text(message)
        percentage = re.search(
            r"(\d+(?:\.\d+)?)\s*%\s*(?:of|चा|ची|चे|चं|पैकी)\s*(\d+(?:\.\d+)?)",
            text
        )
        if percentage:
            percent, value = map(Decimal, percentage.groups())
            answer = percent * value / Decimal("100")
            return (
                f"{DatabaseFallbackProvider._format_decimal(percent)}% of "
                f"{DatabaseFallbackProvider._format_decimal(value)} = "
                f"{DatabaseFallbackProvider._format_decimal(answer)}."
            )

        inverse = re.search(
            r"(\d+(?:\.\d+)?)\s*%\s*(?:=|is|बराबर)\s*(\d+(?:\.\d+)?)",
            text
        )
        if inverse:
            percent, value = map(Decimal, inverse.groups())
            if percent:
                answer = value * Decimal("100") / percent
                return (
                    f"{percent}% = {value} असल्यास पूर्ण संख्या "
                    f"{DatabaseFallbackProvider._format_decimal(answer)} आहे."
                )

        ratio = re.search(
            r"(\d+)\s*[:]\s*(\d+)",
            text
        )
        if ratio and _contains(text, ("simplify", "सोपे", "सरलीकरण")):
            left, right = map(int, ratio.groups())
            divisor = gcd(left, right)
            if divisor:
                return f"{left}:{right} चे सोपे रूप {left // divisor}:{right // divisor}."

        expression = re.search(
            r"(?<![\w.])(-?\d+(?:\.\d+)?)\s*([+\-*/×÷])\s*(-?\d+(?:\.\d+)?)(?![\w.])",
            text
        )
        if expression:
            left_text, operator, right_text = expression.groups()
            left = Decimal(left_text)
            right = Decimal(right_text)
            if operator in ("/", "÷") and right == 0:
                return "शून्याने भागाकार करता येत नाही."
            operations = {
                "+": lambda: left + right,
                "-": lambda: left - right,
                "*": lambda: left * right,
                "×": lambda: left * right,
                "/": lambda: left / right,
                "÷": lambda: left / right,
            }
            result = operations[operator]()
            return (
                f"{left} {operator} {right} = "
                f"{DatabaseFallbackProvider._format_decimal(result)}."
            )
        return None

    @staticmethod
    def _format_decimal(value):
        return format(value.normalize(), "f")

    @classmethod
    def _pyq_answer(cls, message, subject_key):
        subjects = SubjectRepository.get_all()
        subject = next(
            (
                item for item in subjects
                if subject_key and _subject_name_matches(item.name, subject_key)
            ),
            None
        )
        year_match = re.search(r"\b(20\d{2}|19\d{2})\b", message)
        year = int(year_match.group(1)) if year_match else None
        questions = QuestionService.get_pyq(
            subject_id=subject.id if subject else None,
            exam_year=year
        )
        if not questions:
            return (
                "या निवडीसाठी प्लॅटफॉर्ममध्ये PYQ उपलब्ध नाहीत. "
                "प्लॅटफॉर्ममध्ये प्रश्नसंच उपलब्ध झाल्यावर येथे दाखवले जातील."
            )
        lines = ["प्लॅटफॉर्ममधील उपलब्ध PYQ:"]
        for question in questions[:5]:
            year_text = f" ({question.exam_year})" if question.exam_year else ""
            lines.append(
                f"• {question.subject.name}{year_text}: {question.question_text}"
            )
            if question.explanation:
                lines.append(f"  स्पष्टीकरण: {question.explanation}")
        return "\n".join(lines)

    @classmethod
    def _current_affairs_answer(cls, message):
        terms = _expanded_search_terms(message, "current_affairs")
        notes = AIAssistantRepository.search_study_notes(terms, limit=5)
        note = next(
            (
                item for item in notes
                if _contains(
                    normalize_text(
                        f"{item.title} {item.content} {item.subject.name} "
                        f"{item.topic.name}"
                    ),
                    SUBJECT_ALIASES["current_affairs"]
                )
            ),
            None
        )
        if not note:
            return (
                "प्लॅटफॉर्ममध्ये सध्या पडताळलेली चालू घडामोडींची माहिती "
                "उपलब्ध नाही. अद्ययावत माहितीसाठी विश्वसनीय आणि अधिकृत "
                "स्रोत तपासा."
            )
        excerpt = " ".join((note.content or "").split())[:700]
        return f"प्लॅटफॉर्ममधील “{note.title}”:\n{excerpt}"

    @classmethod
    def _database_or_general_answer(cls, message, subject_key):
        math_answer = cls._safe_math_answer(message)
        if math_answer:
            return math_answer

        terms = _expanded_search_terms(message, subject_key)
        notes = AIAssistantRepository.search_study_notes(terms)
        if notes:
            note = notes[0]
            excerpt = " ".join((note.content or "").split())[:700]
            return (
                f"प्लॅटफॉर्ममधील “{note.title}” "
                f"({note.subject.name} / {note.topic.name}):\n"
                f"{excerpt or 'या नोंदीत मजकूर उपलब्ध नाही.'}"
            )

        questions = AIAssistantRepository.search_questions(terms)
        if questions:
            question = questions[0]
            answer = (
                f"{question.subject.name} / {question.topic.name} मधील "
                f"प्रश्न: {question.question_text}"
            )
            if question.explanation:
                answer += f"\nस्पष्टीकरण: {question.explanation}"
            return answer

        if subject_key == "mathematics":
            return cls._study_plan(subject_key)
        if subject_key:
            topic_rows = AIAssistantRepository.search_subject_topics(terms)
            topic_names = [
                f"{topic.subject.name} — {topic.name}"
                for topic in topic_rows if topic.subject
            ]
            if topic_names:
                return (
                    "प्लॅटफॉर्ममध्ये या विषयातील topics:\n"
                    + "\n".join(f"• {name}" for name in topic_names)
                    + "\n\nयासाठी जुळणारे notes उपलब्ध नाहीत. हवे असल्यास "
                    "मी सर्वसाधारण अभ्यास पद्धत सुचवू शकतो."
                )
            return (
                f"{SUBJECT_LABELS[subject_key]} साठी जुळणारे platform notes "
                "आढळले नाहीत. सर्वसाधारण तयारीसाठी topic छोटे भाग करून "
                "अभ्यासा, प्रश्न सोडवा आणि चुका उजळा."
            )

        available = SubjectRepository.get_all()
        if _contains(normalize_text(message), ("important", "महत्त्वाचे", "कोणते विषय")):
            names = ", ".join(subject.name for subject in available)
            if names:
                return (
                    f"प्लॅटफॉर्ममध्ये उपलब्ध विषय: {names}. "
                    "कोणते विषय अधिकृत परीक्षेत असतात हे नवीन भरती "
                    "जाहिरातीतून खात्री करा."
                )
        return (
            "हा प्रश्न अधिक स्पष्ट केल्यास मदत करता येईल. विषय किंवा topic "
            "नावासह पुन्हा विचारा. परीक्षेचे अधिकृत नियम आणि निकष "
            "अधिकृत जाहिरातीतून तपासा."
        )


class PoliceBhartiAssistantService:
    provider = DatabaseFallbackProvider()

    @staticmethod
    def _get_session(user_id: int, session_id):
        if session_id is None:
            return AIAssistantRepository.create_session(
                user_id=user_id,
                session_id=str(uuid4())
            )

        session = AIAssistantRepository.find_session(
            user_id=user_id,
            session_id=str(session_id)
        )
        if not session:
            raise ValueError("Chat session not found.")
        return session

    @staticmethod
    def chat(user_id: int, message: str, session_id=None):
        session = PoliceBhartiAssistantService._get_session(user_id, session_id)
        recent_messages = AIAssistantRepository.get_recent_messages(
            session=session,
            limit=8
        )
        context = next(
            (
                item.message for item in reversed(recent_messages)
                if item.role == "user"
            ),
            ""
        )
        answer = PoliceBhartiAssistantService.provider.generate_response(
            user_id=user_id,
            message=message,
            context=context
        )
        AIAssistantRepository.save_exchange(
            session=session,
            question=message,
            answer=answer
        )
        return {
            "session_id": session.session_id,
            "question": message,
            "answer": answer
        }

    @staticmethod
    def get_history(user_id: int, session_id=None):
        sessions = AIAssistantRepository.get_sessions(
            user_id=user_id,
            session_id=session_id
        )
        if session_id is not None and not sessions:
            raise ValueError("Chat session not found.")
        return [
            {
                "session_id": session.session_id,
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat(),
                "messages": [
                    {
                        "role": message.role,
                        "message": message.message,
                        "created_at": message.created_at.isoformat()
                    }
                    for message in session.messages
                ]
            }
            for session in sessions
        ]

    @staticmethod
    def delete_history(user_id: int, session_id=None):
        deleted = AIAssistantRepository.delete_sessions(
            user_id=user_id,
            session_id=session_id
        )
        if deleted is None:
            raise ValueError("Chat session not found.")
        return {"deleted_sessions": deleted}
