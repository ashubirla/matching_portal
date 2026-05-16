from django.db import models
from django.conf import settings
from django.db import models
from django.contrib.auth.models import User


class Paper(models.Model):
    title = models.CharField(max_length=500)
    abstract = models.TextField()
    pdf_url = models.URLField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submitted_papers"
    )
    author_names = models.JSONField(default=list)
    paper_affiliations = models.JSONField(default=list)
    status = models.CharField(max_length=20, default="submitted")
    class Meta:
        db_table = "papers"
    def __str__(self):
        return self.title
    