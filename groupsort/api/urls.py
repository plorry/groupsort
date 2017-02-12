from rest_framework import routers
from groupsort.api.views import (NameListViewSet, PersonViewSet, GroupsViewSet,
                                 GroupSetViewSet,)

router = routers.SimpleRouter()
router.register(r'namelists', NameListViewSet)
router.register(r'people', PersonViewSet)
router.register(r'groupsets', GroupSetViewSet)
router.register(r'groups', GroupsViewSet)

api_patterns = router.urls
