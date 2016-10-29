from .models import NameList, Person, Pairing, Groups, GroupSet
from django.template import RequestContext
from django.shortcuts import render_to_response
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.db.models import Q
from django.views.generic.base import TemplateView, RedirectView
from django.contrib.auth.decorators import login_required
import json
import random


class JSONResponseMixin(object):
    """
    A mixin that can be used to render a JSON response.
    """
    def render_to_json_response(self, context, **response_kwargs):
        """
        Returns a JSON response, transforming 'context' to make the payload.
        """
        return JsonResponse(
            self.get_data(context),
            **response_kwargs
        )

    def get_data(self, context):
        """
        Returns an object that will be serialized as JSON by json.dumps().
        """
        # Note: This is *EXTREMELY* naive; in reality, you'll need
        # to do much more complex handling to ensure that arbitrary
        # objects -- such as Django model instances or querysets
        # -- can be serialized as JSON.
        return context


class GroupSortView(TemplateView):
    template_name = 'home.html'

    def get_context_data(self, request, *args, **kwargs):
        context = super(GroupSortView, self).get_context_data(*args, **kwargs)

        context.update({
            'groups': NameList.objects.all()
        })

        return context

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, **kwargs)

        return self.render_to_response(context)

class AjaxAddNamelistView(JSONResponseMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        return self.render_to_json_response(context, **response_kwargs)

    def post(self, request, *args, **kwargs):
        data = request.POST

        title = data.get('title')
        namelist = NameList.objects.create(
            title=title
        )
        response = {
            'namelist': {
                'id': namelist.id,
                'title': namelist.title
            }
        }

        return self.render_to_response(response)


class AjaxAddPersonView(JSONResponseMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        return self.render_to_json_response(context, **response_kwargs)

    def post(self, request, *args, **kwargs):
        data = request.POST

        name = data.get('name')
        namelist_id = data.get('namelist_id')

        person = Person.objects.create(
            name=name,
            namelist_id=namelist_id
        )

        response = {
            'person': {
                'id': person.id,
                'name': person.name,
                'namelist_id': person.namelist_id,
            }
        }

        return self.render_to_response(response)


class AjaxGetNamelists(JSONResponseMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        return self.render_to_json_response(context, **response_kwargs)

    def get(self, request, *args, **kwargs):
        namelists = NameList.objects.all()
        response = {
            'titles': [{'id': namelist.id, 'title': namelist.title} for namelist in namelists]
        }
        return self.render_to_response(response)


class AjaxGetNamelist(JSONResponseMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        return self.render_to_json_response(context, **response_kwargs)

    def get(self, request, *args, **kwargs):
        data = request.GET
        try:
            namelist = NameList.objects.get(id=data.get('namelist'))
            members = namelist.people.all()
            response = {
                'members': [{'id': person.id, 'name': person.name} for person in members]
            }
        except NameList.DoesNotExist:
            response = {'message': ['big', 'dog', 'fug']}
        return self.render_to_response(response)


class Group(object):
    def __init__(self, size):
        self.people = []
        self.size = size

    def add_person(self, person):
        self.people.append(person)

    def get_size(self):
        return self.size

    def is_full(self):
        return len(self.people) >= self.size

    def serialize(self):
        return [{'id': person.id, 'name': person.name} for person in self.people]


class AjaxGetPairings(JSONResponseMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        return self.render_to_json_response(context, **response_kwargs)

    def generate_pairs(self, namelist):
        people = namelist.people.all()

        for person1 in people:
            for person2 in people:
                if person1 != person2:
                    pairing = Pairing.objects.filter(people__in=[person1.id]).filter(people__in=[person2.id])
                    if pairing.count() == 0:
                        pairing = Pairing.objects.create(namelist=namelist)
                        pairing.people.add(person1)
                        pairing.people.add(person2)

    def get(self, request, *args, **kwargs):
        namelist = NameList.objects.get(id=request.GET.get('namelist_id'))

        self.generate_pairs(namelist)

        pairings = namelist.pairings.all().order_by('count')

        return self.render_to_response(
            {'pairings': [pairing.serialize() for pairing in pairings]}
        )

class AjaxCreateGroups(JSONResponseMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        return self.render_to_json_response(context, **response_kwargs)

    def generate_pairs(self, namelist):
        people = namelist.people.all()

        for person1 in people:
            for person2 in people:
                if person1 != person2:
                    pairing = Pairing.objects.filter(people__in=[person1.id]).filter(people__in=[person2.id])
                    if pairing.count() == 0:
                        pairing = Pairing.objects.create(namelist=namelist)
                        pairing.people.add(person1)
                        pairing.people.add(person2)

    def get(self, request, *args, **kwargs):
        namelist = NameList.objects.get(id=request.GET.get('namelist_id'))
        groups_data = request.GET.get('groups').split(',')
        all_people = Person.objects.filter(namelist=namelist).order_by('?')
        groups = []

        self.generate_pairs(namelist)

        for group_size in groups_data:
            group = Group(int(group_size))
            groups.append(group)

        pairings = namelist.pairings.all().order_by('count')

        ordered_people = []
        for pairing in pairings:
            for person in pairing.people.all():
                if person not in ordered_people:
                    ordered_people.append(person)

        for group in groups:
            # get group leaders
            group.add_person(ordered_people.pop())

        while len(ordered_people) > 0:
            for group in groups:
                if group.is_full():
                    continue
                # Find the person with the lowest total matching count
                person_to_use = None
                lowest_count = None
                random.shuffle(ordered_people)
                for person in ordered_people:
                    count = 0
                    for people in group.people:
                        pairing = pairings.filter(people__in=[people]).filter(people__in=[person]).get()
                        count += pairing.count
                    if lowest_count == None or count < lowest_count:
                        lowest_count = count
                        person_to_use = person
                ordered_people.remove(person_to_use)
                group.add_person(person_to_use)

        serialized_groups = [group.serialize() for group in groups]
        return self.render_to_response({
            'groups': serialized_groups
        })


class AjaxSaveGroups(JSONResponseMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        return self.render_to_json_response(context, **response_kwargs)

    def post(self, request, *args, **kwargs):
        data = request.POST
        groups = json.loads(data.get('groups')).get('groups')
        namelist = NameList.objects.get(id=data.get('namelist_id'))
        groupset_title = data.get('group_title')

        groupset = GroupSet.objects.create(
            namelist=namelist,
            title=groupset_title
        )
        for group_data in groups:
            group = Groups.objects.create(
                groupset=groupset
            )
            for person_data in group_data:
                person = Person.objects.get(id=person_data.get('id'))
                group.people.add(person)
            group.increment_pairings()

        return self.render_to_response({'status': 'done'})


class AjaxLoadGroups(JSONResponseMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        return self.render_to_json_response(context, **response_kwargs)

    def get(self, request, *args, **kwargs):
        data = request.GET
        namelist = NameList.objects.get(id=data.get('namelist_id'))
        groupsets = namelist.groupsets.all()
        response = {
            'groupsets': []
        }
        for groupset in groupsets:
            response.get('groupsets').append(groupset.serialize())
        return response

class GroupsView(TemplateView):
    template_name = 'groups_view.html'

    def get_context_data(self, request, *args, **kwargs):
        context = super(GroupsView, self).get_context_data(*args, **kwargs)

        data = request.GET
        namelist = NameList.objects.get(id=data.get('namelist_id'))
        groupsets = namelist.groupsets.filter(deleted=False)

        context.update({
            'namelist': namelist,
            'groupsets': groupsets,
        })

        return context

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, **kwargs)

        return self.render_to_response(context)


class DeleteView(JSONResponseMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        return self.render_to_json_response(context, **response_kwargs)

    def post(self, request, *args, **kargs):
        data = request.POST
        groupset_id = data.get('groupset_id')
        groupset = GroupSet.objects.get(id=groupset_id)

        groupset.delete()

        return self.render_to_response({
            'status': 'success',
        })

class AjaxSaveRepeats(JSONResponseMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        return self.render_to_json_response(context, **response_kwargs)

    def post(self, request, *args, **kwargs):
        data = request.POST
        groupset_id = data.get('groupset_id')
        groupset = GroupSet.objects.get(id=groupset_id)
        groupset.set_repeats(data.get('count'))

        return self.render_to_response({
            'status': 'success',
        })
