"""groupsort URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.10/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include
from django.contrib import admin

from groupsort.views import (GroupSortView, AjaxAddNamelistView, AjaxSaveGroups, GroupsView,
    AjaxGetNamelist, AjaxGetNamelists, AjaxAddPersonView, AjaxCreateGroups)

urlpatterns = [
    url(r'^$', GroupSortView.as_view(), name="home"),
    #url(r'^namelist/(?P<namelist_id>[0-9]+)/sort/(?P<num_groups>[0-9]+)/$', GroupsView.as_view(), name="groups"),
    url(r'^add_namelist/$', AjaxAddNamelistView.as_view(), name="add_namelist"),
    url(r'^get_namelist/$', AjaxGetNamelist.as_view(), name="get_namelist"),
    url(r'^get_namelists/$', AjaxGetNamelists.as_view(), name="get_namelists"),
    url(r'^add_person/$', AjaxAddPersonView.as_view(), name="add_person"),
    url(r'^create_groups/$', AjaxCreateGroups.as_view(), name="create_groups"),
    url(r'^save_groups/$', AjaxSaveGroups.as_view(), name="save_groups"),
    url(r'^saved_groups/$', GroupsView.as_view(), name='saved_groups'),
]
