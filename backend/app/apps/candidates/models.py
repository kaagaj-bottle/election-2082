from django.db import models


class ElectionType(models.TextChoices):
    FPTP = "fptp", "First Past The Post"
    PR = "pr", "Proportional Representation"


class Gender(models.TextChoices):
    MALE = "male", "Male"
    FEMALE = "female", "Female"
    OTHER = "other", "Other"


class Candidate(models.Model):
    # Identity
    source_id = models.PositiveIntegerField()
    election = models.ForeignKey(
        "elections.Election", on_delete=models.CASCADE, related_name="candidates"
    )
    election_type = models.CharField(max_length=4, choices=ElectionType.choices)

    # Personal
    name_ne = models.CharField(max_length=300)
    name = models.CharField(max_length=300, blank=True)
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=6, choices=Gender.choices)
    father_name = models.CharField(max_length=300, blank=True)
    spouse_name = models.CharField(max_length=300, blank=True)
    address = models.TextField(blank=True)
    citizenship_district = models.CharField(max_length=100, blank=True)

    # Education / Experience
    qualification = models.CharField(max_length=200, blank=True)
    institution = models.CharField(max_length=300, blank=True)
    experience = models.TextField(blank=True)
    other_details = models.TextField(blank=True)

    # Political
    party = models.ForeignKey("parties.Party", on_delete=models.CASCADE, related_name="candidates")
    election_symbol_code = models.PositiveIntegerField(null=True, blank=True)
    election_symbol_name = models.CharField(max_length=100, blank=True)

    # Geographic (FPTP)
    constituency = models.ForeignKey(
        "elections.Constituency",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="candidates",
    )

    # Results (FPTP)
    votes_received = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=50, blank=True)

    # PR-specific
    closed_list_rank = models.PositiveSmallIntegerField(null=True, blank=True)
    voter_id = models.CharField(max_length=50, blank=True)
    inclusion_group = models.CharField(max_length=100, blank=True)
    has_disability = models.BooleanField(default=False)

    # Media
    photo_url = models.URLField(max_length=500, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["election", "source_id"], name="uq_candidate_election_source"
            ),
        ]
        indexes = [
            models.Index(fields=["election", "election_type"]),
            models.Index(fields=["election", "party"]),
            models.Index(fields=["constituency"]),
            models.Index(fields=["gender"]),
            models.Index(fields=["election_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.name_ne} ({self.election_type})"
