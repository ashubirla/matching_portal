from django.conf import settings
from django.db import models


class Researcher(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="researcher"
    )
    
    name = models.CharField(max_length=255)
    institutions = models.JSONField(default=list)
    is_reviewer = models.BooleanField(default=False)
    work = models.TextField(null=True, blank=True)
    class Meta:
        db_table = "researchers"

    def __str__(self):
        return self.name