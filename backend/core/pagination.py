# ═════════════════════════════════════════════════════════════════════════════
# core/pagination.py
# ═════════════════════════════════════════════════════════════════════════════
 
"""
core/pagination.py
 
Custom pagination classes for the KCSE API.
"""
 
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
 
 
class StandardResultsSetPagination(PageNumberPagination):
    """
    Default pagination for list endpoints.
    Clients may override the page size up to a maximum of 200.
 
    Query params:
        ?page=2          — page number (1-indexed)
        ?page_size=50    — results per page (default 20, max 200)
    """
 
    page_size              = 20
    page_size_query_param  = 'page_size'
    max_page_size          = 200
    page_query_param       = 'page'
 
    def get_paginated_response(self, data):
        return Response({
            'pagination': {
                'count':     self.page.paginator.count,
                'total_pages': self.page.paginator.num_pages,
                'current_page': self.page.number,
                'page_size':  self.get_page_size(self.request),
                'next':      self.get_next_link(),
                'previous':  self.get_previous_link(),
            },
            'results': data,
        })
 
    def get_paginated_response_schema(self, schema):
        return {
            'type': 'object',
            'properties': {
                'pagination': {
                    'type': 'object',
                    'properties': {
                        'count':        {'type': 'integer'},
                        'total_pages':  {'type': 'integer'},
                        'current_page': {'type': 'integer'},
                        'page_size':    {'type': 'integer'},
                        'next':         {'type': 'string', 'nullable': True},
                        'previous':     {'type': 'string', 'nullable': True},
                    },
                },
                'results': schema,
            },
        }
 
 
class LargeResultsSetPagination(PageNumberPagination):
    """
    For analytics endpoints that may need to return more data at once.
    """
    page_size             = 100
    page_size_query_param = 'page_size'
    max_page_size         = 1000