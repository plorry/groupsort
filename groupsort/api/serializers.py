from rest_framework import serializers
from groupsort.models import NameList, Person, Groups, GroupSet


class PersonSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Person
        fields = ('name', 'id', 'url',)


class GroupsSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Groups
        fields = ('groupset', 'people',)


class GroupSetSerializer(serializers.HyperlinkedModelSerializer):
    groups = GroupsSerializer(many=True)

    class Meta:
        model = GroupSet
        fields = ('namelist', 'title', 'deleted', 'repeats', 'groups',)


class NameListSerializer(serializers.HyperlinkedModelSerializer):
    people = PersonSerializer(many=True)
    groupsets = GroupSetSerializer(many=True)

    class Meta:
        model = NameList
        fields = ('title', 'user', 'people', 'groupsets',)
