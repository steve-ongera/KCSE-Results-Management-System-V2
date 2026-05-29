"""
core/exceptions.py
 
Custom DRF exception handler.
Normalises all API error responses into a consistent JSON envelope:
 
  Success:  { data: {...} }          (DRF default — unchanged)
  Error:    {
              "status": "error",
              "code":   404,
              "message": "Not found.",
              "errors": { "field": ["msg"] }   ← only on validation errors
            }
"""
 
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status as drf_status
 
 
def custom_exception_handler(exc, context):
    """
    Called by DRF for every unhandled exception.
    Wraps the default response in our standard error envelope.
    """
    # Call DRF's default handler first
    response = exception_handler(exc, context)
 
    if response is not None:
        data = response.data
 
        # Extract a human-readable message
        if isinstance(data, dict):
            message = (
                data.get('detail')
                or data.get('non_field_errors', [None])[0]
                or 'An error occurred.'
            )
            # Field-level validation errors (exclude top-level keys we already handle)
            errors = {
                k: v for k, v in data.items()
                if k not in ('detail', 'non_field_errors')
            } or None
        elif isinstance(data, list):
            message = data[0] if data else 'An error occurred.'
            errors  = None
        else:
            message = str(data)
            errors  = None
 
        response.data = {
            'status':  'error',
            'code':    response.status_code,
            'message': str(message),
            'errors':  errors,
        }
 
    return response
 
 