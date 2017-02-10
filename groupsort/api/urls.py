from django.conf.urls import url
from rest_framework import routers
from groupsort.api.views import NameListViewSet

router = routers.SimpleRouter()
router.register(r'namelists', NameListViewSet)

api_patterns = router.urls
