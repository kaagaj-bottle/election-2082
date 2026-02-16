from django.db import models


class Election(models.Model):
    name = models.CharField(max_length=200)
    name_ne = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=50)
    election_date = models.DateField()
    total_seats_fptp = models.PositiveSmallIntegerField()
    total_seats_pr = models.PositiveSmallIntegerField()
    is_active = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name


class Province(models.Model):
    source_id = models.PositiveSmallIntegerField(unique=True)
    name = models.CharField(max_length=100)
    name_ne = models.CharField(max_length=100)

    def __str__(self) -> str:
        return self.name


class District(models.Model):
    name = models.CharField(max_length=100)
    name_ne = models.CharField(max_length=100)
    province = models.ForeignKey(Province, on_delete=models.CASCADE, related_name="districts")

    class Meta:
        indexes = [models.Index(fields=["name_ne"])]
        constraints = [
            models.UniqueConstraint(
                fields=["province", "name_ne"], name="uq_district_province_name"
            ),
        ]

    def __str__(self) -> str:
        return self.name_ne


class Constituency(models.Model):
    number = models.PositiveSmallIntegerField()
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name="constituencies")

    class Meta:
        verbose_name_plural = "constituencies"
        constraints = [
            models.UniqueConstraint(
                fields=["district", "number"], name="uq_constituency_district_number"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.district.name_ne}-{self.number}"
