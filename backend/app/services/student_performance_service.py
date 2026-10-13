from collections import defaultdict
from decimal import Decimal

from app.config.config import Config
from app.repositories.student_performance_repository import (
    StudentPerformanceRepository
)


class StudentPerformanceService:

    @staticmethod
    def get_attempt_comparison_insights(attempt):
        """Return rank and prior-attempt comparison shared by result and history."""
        if attempt.status != "submitted":
            return {
                "rank": None,
                "previous_score": None,
                "previous_percentage": None,
                "improvement_percentage_points": None,
            }

        rank = StudentPerformanceRepository.get_attempt_rank(attempt)
        previous = StudentPerformanceRepository.get_previous_submitted_attempt(
            attempt
        )
        previous_score = float(previous.score) if previous else None
        previous_percentage = float(previous.percentage) if previous else None
        improvement = (
            round(float(attempt.percentage) - previous_percentage, 2)
            if previous_percentage is not None else None
        )

        return {
            "rank": rank,
            "previous_score": previous_score,
            "previous_percentage": previous_percentage,
            "improvement_percentage_points": improvement,
        }

    @staticmethod
    def get_attempt_result_insights(attempt):
        """Build safe, attempt-scoped result analytics using performance rules."""
        comparison = StudentPerformanceService.get_attempt_comparison_insights(
            attempt
        )
        if attempt.status != "submitted":
            return {
                **comparison,
                "strong_topics": [],
                "weak_topics": [],
            }

        grouped = defaultdict(lambda: {
            "topic": None,
            "correct": 0,
            "wrong": 0,
            "attempted": 0,
            "total_questions": 0,
        })
        for question, topic, answer in (
            StudentPerformanceRepository.get_attempt_topic_answer_rows(attempt)
        ):
            stats = grouped[topic.id]
            stats["topic"] = topic
            stats["total_questions"] += 1
            if answer is None or answer.selected_option is None:
                continue
            stats["attempted"] += 1
            if answer.is_correct:
                stats["correct"] += 1
            else:
                stats["wrong"] += 1

        threshold = float(Config.PERFORMANCE_STRONG_ACCURACY_THRESHOLD)
        minimum_questions = int(Config.PERFORMANCE_MIN_TOPIC_QUESTIONS)
        strong_topics = []
        weak_topics = []
        for topic_id in sorted(grouped):
            stats = grouped[topic_id]
            attempted = stats["attempted"]
            if attempted < minimum_questions:
                continue
            percentage = round(stats["correct"] * 100 / attempted, 2)
            item = {
                "topic_id": topic_id,
                "topic_name": stats["topic"].name,
                "percentage": percentage,
                "correct": stats["correct"],
                "wrong": stats["wrong"],
                "attempted": attempted,
                "total_questions": stats["total_questions"],
            }
            if percentage >= threshold:
                strong_topics.append(item)
            else:
                weak_topics.append(item)

        return {
            **comparison,
            "strong_topics": strong_topics,
            "weak_topics": weak_topics,
        }

    @staticmethod
    def _number(value):
        if value is None:
            return None
        return float(value)

    @staticmethod
    def _date(value):
        return value.isoformat() if value else None

    @staticmethod
    def _attempt_date(attempt):
        return attempt.submitted_at or attempt.started_at

    @staticmethod
    def _attempt_data(attempt):
        test = attempt.test
        return {
            "attempt_id": attempt.id,
            "test_id": attempt.test_id,
            "test_name": test.title if test else None,
            "test_type": test.test_type if test else None,
            "date": StudentPerformanceService._date(
                StudentPerformanceService._attempt_date(attempt)
            ),
            "score": StudentPerformanceService._number(attempt.score),
            "percentage": StudentPerformanceService._number(
                attempt.percentage
            ),
            "correct": attempt.correct_answers,
            "wrong": attempt.wrong_answers,
            "skipped": attempt.skipped_answers,
            "total_questions": (
                attempt.correct_answers
                + attempt.wrong_answers
                + attempt.skipped_answers
            ),
            "time_taken_seconds": attempt.time_taken_seconds
        }

    @staticmethod
    def _grouped_performance(rows, records, group_by):
        grouped = defaultdict(lambda: {
            "attempt_ids": set(),
            "correct": 0,
            "wrong": 0,
            "skipped": 0,
            "score": Decimal("0"),
            "possible_marks": Decimal("0")
        })

        for attempt, answer, question, subject, topic in rows:
            record = subject if group_by == "subject" else topic
            stats = grouped[record.id]
            stats["attempt_ids"].add(attempt.id)
            stats["score"] += Decimal(str(answer.marks_obtained or 0))
            stats["possible_marks"] += Decimal(str(question.marks or 0))

            if answer.selected_option is None:
                stats["skipped"] += 1
            elif answer.is_correct:
                stats["correct"] += 1
            else:
                stats["wrong"] += 1

        output = []
        for record in records:
            stats = grouped.get(record.id, {})
            correct = stats.get("correct", 0)
            wrong = stats.get("wrong", 0)
            skipped = stats.get("skipped", 0)
            attempted = correct + wrong
            score = stats.get("score", Decimal("0"))
            possible_marks = stats.get("possible_marks", Decimal("0"))
            accuracy = (
                correct * 100 / attempted
                if attempted
                else None
            )
            percentage = (
                float(score / possible_marks * Decimal("100"))
                if possible_marks
                else None
            )
            item = {
                "total_tests": len(stats.get("attempt_ids", set())),
                "questions_attempted": attempted,
                "correct": correct,
                "wrong": wrong,
                "skipped": skipped,
                "score": float(score),
                "percentage": percentage,
                "accuracy": accuracy
            }
            if group_by == "subject":
                item.update({
                    "subject_id": record.id,
                    "subject_name": record.name
                })
            else:
                item.update({
                    "subject_id": (
                        record.subject.id if record.subject else None
                    ),
                    "subject_name": (
                        record.subject.name if record.subject else None
                    ),
                    "topic_id": record.id,
                    "topic_name": record.name
                })
            output.append(item)

        return output

    @staticmethod
    def get_overview(student_id: int):
        attempts = StudentPerformanceRepository.get_attempts(student_id)
        completed = [
            attempt for attempt in attempts
            if attempt.status == "submitted"
        ]
        scores = [float(attempt.score) for attempt in completed]
        percentages = [float(attempt.percentage) for attempt in completed]
        correct = sum(attempt.correct_answers for attempt in completed)
        wrong = sum(attempt.wrong_answers for attempt in completed)
        skipped = sum(attempt.skipped_answers for attempt in completed)

        ordered_completed = sorted(
            completed,
            key=StudentPerformanceService._attempt_date
        )
        improvement = None
        if len(ordered_completed) >= 2:
            improvement = (
                float(ordered_completed[-1].percentage)
                - float(ordered_completed[0].percentage)
            )

        return {
            "total_tests": len({attempt.test_id for attempt in attempts}),
            "total_test_attempts": len(attempts),
            "completed_tests": len(completed),
            "total_questions_attempted": correct + wrong,
            "total_correct": correct,
            "total_wrong": wrong,
            "total_skipped": skipped,
            "average_score": (
                sum(scores) / len(scores) if scores else None
            ),
            "average_percentage": (
                sum(percentages) / len(percentages)
                if percentages else None
            ),
            "best_score": max(scores) if scores else None,
            "best_percentage": max(percentages) if percentages else None,
            "overall_accuracy": (
                correct * 100 / (correct + wrong)
                if correct + wrong else None
            ),
            "total_study_attempts": None,
            "improvement_percentage": improvement
        }

    @staticmethod
    def get_subject_performance(student_id: int):
        rows = StudentPerformanceRepository.get_submitted_answer_rows(
            student_id
        )
        return StudentPerformanceService._grouped_performance(
            rows,
            StudentPerformanceRepository.get_subjects(),
            "subject"
        )

    @staticmethod
    def get_topic_performance(student_id: int):
        rows = StudentPerformanceRepository.get_submitted_answer_rows(
            student_id
        )
        topics = StudentPerformanceRepository.get_topics()
        return StudentPerformanceService._grouped_performance(
            rows,
            topics,
            "topic"
        )

    @staticmethod
    def get_strengths(student_id: int):
        topics = StudentPerformanceService.get_topic_performance(student_id)
        threshold = float(Config.PERFORMANCE_STRONG_ACCURACY_THRESHOLD)
        minimum_questions = int(Config.PERFORMANCE_MIN_TOPIC_QUESTIONS)
        strong = []
        weak = []
        insufficient = []

        for topic in topics:
            if topic["questions_attempted"] < minimum_questions:
                insufficient.append(topic)
            elif topic["accuracy"] is not None and topic["accuracy"] >= threshold:
                strong.append(topic)
            else:
                weak.append(topic)

        return {
            "accuracy_threshold": threshold,
            "minimum_questions": minimum_questions,
            "strong_topics": strong,
            "weak_topics": weak,
            "insufficient_data_topics": insufficient
        }

    @staticmethod
    def get_progress(student_id: int):
        attempts = StudentPerformanceRepository.get_attempts(student_id)
        completed = [
            attempt for attempt in attempts
            if attempt.status == "submitted"
        ]
        completed.sort(key=StudentPerformanceService._attempt_date)
        return [
            {
                "attempt_id": attempt.id,
                "test_name": (
                    attempt.test.title if attempt.test else None
                ),
                "date": StudentPerformanceService._date(
                    StudentPerformanceService._attempt_date(attempt)
                ),
                "score": StudentPerformanceService._number(attempt.score),
                "percentage": StudentPerformanceService._number(
                    attempt.percentage
                )
            }
            for attempt in completed
        ]

    @staticmethod
    def get_test_history(student_id: int):
        attempts = StudentPerformanceRepository.get_attempts(student_id)
        completed = [
            attempt for attempt in attempts
            if attempt.status == "submitted"
        ]
        completed.sort(
            key=StudentPerformanceService._attempt_date,
            reverse=True
        )
        return [
            StudentPerformanceService._attempt_data(attempt)
            for attempt in completed
        ]

    @staticmethod
    def get_physical_performance(student_id: int):
        records = StudentPerformanceRepository.get_physical_records(
            student_id
        )
        latest = records[0] if records else None
        previous = records[1] if len(records) > 1 else None

        def measurements(record):
            if not record:
                return None
            return {
                "id": record.id,
                "date": record.date.isoformat(),
                "weight": StudentPerformanceService._number(record.weight),
                "running_distance": StudentPerformanceService._number(
                    record.running_distance
                ),
                "running_time": StudentPerformanceService._number(
                    record.running_time
                ),
                "run_100m": StudentPerformanceService._number(
                    record.run_100m
                ),
                "run_800m": StudentPerformanceService._number(
                    record.run_800m
                ),
                "run_1600m": StudentPerformanceService._number(
                    record.run_1600m
                ),
                "shot_put": StudentPerformanceService._number(
                    record.shot_put
                ),
                "push_ups": record.push_ups
            }

        return {
            "latest_weight": (
                StudentPerformanceService._number(latest.weight)
                if latest else None
            ),
            "previous_weight": (
                StudentPerformanceService._number(previous.weight)
                if previous else None
            ),
            "weight_change": (
                StudentPerformanceService._number(
                    Decimal(str(latest.weight)) - Decimal(str(previous.weight))
                )
                if latest and previous
                and latest.weight is not None
                and previous.weight is not None
                else None
            ),
            "latest": measurements(latest),
            "history": [
                measurements(record) for record in reversed(records)
            ]
        }

    @staticmethod
    def get_complete_performance(student_id: int):
        return {
            "overview": StudentPerformanceService.get_overview(student_id),
            "subjects": StudentPerformanceService.get_subject_performance(
                student_id
            ),
            "topics": StudentPerformanceService.get_topic_performance(
                student_id
            ),
            "strengths": StudentPerformanceService.get_strengths(student_id),
            "progress": StudentPerformanceService.get_progress(student_id),
            "test_history": StudentPerformanceService.get_test_history(
                student_id
            ),
            "physical": StudentPerformanceService.get_physical_performance(
                student_id
            )
        }
