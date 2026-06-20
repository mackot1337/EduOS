from datetime import datetime, timedelta, timezone

class SpacedRepetitionService:
    INTERVALS_IN_DAYS = {
        0: 0,  
        1: 1,   
        2: 3,   
        3: 7,   
        4: 14,  
        5: 30,  
        6: 90   
    }

    MAX_LEVEL = 6

    @staticmethod
    def calculate_next_review(current_level: int, recall_quality: int) -> tuple[int, datetime]:
        if recall_quality == 0:
            new_level = 0
        elif recall_quality == 1:
            new_level = max(0, current_level - 1)
        elif recall_quality == 2:
            new_level = min(SpacedRepetitionService.MAX_LEVEL, current_level + 1)
        else:
            raise ValueError("Ocena jakości (recall_quality) musi być w przedziale 0-2.")

        days_to_add = SpacedRepetitionService.INTERVALS_IN_DAYS.get(new_level, 1)
        next_review_date = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=days_to_add)

        return new_level, next_review_date