from django.db import models
from django.contrib.auth.models import User

class NameList(models.Model):
    title = models.CharField(max_length=50)
    user = models.ForeignKey(User, blank=True, null=True)
    def __unicode__(self):
        return self.title

    def add_person(name):
        person = Person.objects.create(namelist=self, name=name)
        return person

class Person(models.Model):
    name = models.CharField(max_length=50)
    namelist = models.ForeignKey(NameList, related_name='people')
    forbidden_pairings = models.ManyToManyField("self")

    def __unicode__(self):
        return self.name

    def pair_with(other_person):
        pairing = Pairing.objects.create(namelist=self.namelist)
        pairing.people.add([self, other_person])

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
        }

class Pairing(models.Model):
    people = models.ManyToManyField(Person, related_name='pairings')
    count = models.IntegerField(default=0)
    last_pairing = models.DateTimeField(auto_now=True)
    namelist = models.ForeignKey(NameList, related_name='pairings')

    def __unicode__(self):
        return ', '.join([person.name for person in self.people.all()])

    def set_count(self):
        count = 0
        groups = Groups.objects.filter(groupset__deleted=False, groupset__namelist=self.namelist, people__in=[self.people.first()]).filter(people__in=[self.people.last()])
        for group in groups:
            count += group.groupset.repeats
        self.count = count
        self.save()

    def serialize(self):
        return {
            'people': [person.id for person in self.people.all()],
            'count': self.count,
        }

class Groups(models.Model):
    groupset = models.ForeignKey('GroupSet', related_name='groups')
    people = models.ManyToManyField(Person, blank=True, null=True)

    def get_pairings(self):
        pairings = []
        for person1 in self.people.all():
            for person2 in self.people.all():
                if person1 != person2:
                    print(person1, person2)
                    try:
                        pairing = Pairing.objects.filter(people__in=[person1]).filter(people__in=[person2]).get()
                    except:
                        pairing = Pairing.objects.create(namelist=self.groupset.namelist)
                        pairing.people.add(person1)
                        pairing.people.add(person2)
                    if pairing not in pairings:
                        pairings.append(pairing)

        return pairings

    def serialize(self):
        response = {
            'people': [],
        }
        for person in self.people.all():
            response.get('people').append(person.serialize())
        overlap_value = 0
        for pairing in self.get_pairings():
            overlap_value += pairing.count
        response.update({'overlap_value': overlap_value})
        return response

    def increment_pairings(self):
        for pairing in self.get_pairings():
            pairing.set_count()

    def decrement_pairings(self):
        for pairing in self.get_pairings():
            pairing.set_count()

class GroupSet(models.Model):
    namelist = models.ForeignKey(NameList, related_name='groupsets')
    title = models.CharField(max_length=20)
    deleted = models.BooleanField(default=False)
    repeats = models.IntegerField(default=1)

    def serialize(self):
        response = {
            'title': self.title,
            'groups': [],
            'repeats': self.repeats
        }
        for group in self.groups.all():
            response.get('groups').append(group.serialize())
        return response

    def delete(self):
        if self.deleted:
            return
        self.deleted = True
        for group in self.groups.all():
            group.decrement_pairings()
        self.save()

    def set_repeats(self, repeats):
        self.repeats = repeats
        self.save()
        for group in self.groups.all():
            group.increment_pairings()
