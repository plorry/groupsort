from rest_framework import viewsets
from groupsort.api.serializers import (NameListSerializer, PersonSerializer,
                                       GroupsSerializer, GroupSetSerializer,)
from groupsort.models import NameList, Person, Groups, GroupSet


class NameListViewSet(viewsets.ModelViewSet):
    serializer_class = NameListSerializer
    queryset = NameList.objects.all()


class PersonViewSet(viewsets.ModelViewSet):
    serializer_class = PersonSerializer
    queryset = Person.objects.all()


class GroupsViewSet(viewsets.ModelViewSet):
    serializer_class = GroupsSerializer
    queryset = Groups.objects.all()


class GroupSetViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSetSerializer
    queryset = GroupSet.objects.all()
