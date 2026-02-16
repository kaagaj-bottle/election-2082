from django.db import models


class Party(models.Model):
    name_ne = models.CharField(max_length=300, unique=True)
    name = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name_plural = "parties"

    def __str__(self) -> str:
        return self.name_ne
