from rest_framework import viewsets
from groupsort.api.serializers import NameListSerializer
from groupsort.models import NameList


class NameListViewSet(viewsets.ModelViewSet):
    serializer_class = NameListSerializer
    queryset = NameList.objects.all()
