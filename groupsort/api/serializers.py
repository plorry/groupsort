from rest_framework import serializers
from groupsort.models import NameList, Person, Groups, GroupSet


class NameListSerializer(serializers.ModelSerializer):
    class Meta:
        model = NameList
        fields = ('title', 'user')


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person


class GroupsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Groups


class GroupSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupSet
