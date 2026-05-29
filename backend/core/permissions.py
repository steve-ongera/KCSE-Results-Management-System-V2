"""
core/permissions.py
 
Custom DRF permission classes for the KCSE Management System.
 
Role hierarchy (defined on the User model in apps/accounts/models.py):
  KNEC_ADMIN        — Full system access; publish results, approve candidates
  COUNTY_OFFICER    — County-level candidate approval
  SUBCOUNTY_OFFICER — Sub-county approval workflow
  SCHOOL_OFFICER    — Register candidates, submit for approval
  EXAMINER          — Enter / view marks for assigned scripts
  TEAM_LEADER       — Approve marks entered by examiners
  CHIEF_EXAMINER    — Lock approved marks
"""
 
from rest_framework.permissions import BasePermission, SAFE_METHODS
 
 
class IsKNECAdmin(BasePermission):
    """
    Grants access only to users with the KNEC_ADMIN role.
    Used for results publication, candidate final approval, audit log access.
    """
 
    message = "Only KNEC administrators are permitted to perform this action."
 
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'KNEC_ADMIN'
        )
 
 
class IsExaminationOfficer(BasePermission):
    """
    Grants access to KNEC_ADMIN, COUNTY_OFFICER, SUBCOUNTY_OFFICER, or SCHOOL_OFFICER.
    Used for candidate management and script tracking.
    """
 
    ALLOWED_ROLES = {'KNEC_ADMIN', 'COUNTY_OFFICER', 'SUBCOUNTY_OFFICER', 'SCHOOL_OFFICER'}
    message = "You must be a registered examination officer to perform this action."
 
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in self.ALLOWED_ROLES
        )
 
 
class IsSchoolOfficer(BasePermission):
    """
    Grants access to SCHOOL_OFFICER and above.
    Used for registering candidates at school level.
    """
 
    ALLOWED_ROLES = {'KNEC_ADMIN', 'COUNTY_OFFICER', 'SUBCOUNTY_OFFICER', 'SCHOOL_OFFICER'}
    message = "You must be a school examination officer to perform this action."
 
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in self.ALLOWED_ROLES
        )
 
    def has_object_permission(self, request, view, obj):
        """School officers can only manage their own center's candidates."""
        user = request.user
        if getattr(user, 'role', None) == 'KNEC_ADMIN':
            return True
        center = getattr(user, 'examination_center', None)
        candidate_center = getattr(obj, 'examination_center', None)
        return center and candidate_center and center == candidate_center
 
 
class IsExaminer(BasePermission):
    """
    Grants access to EXAMINER, TEAM_LEADER, CHIEF_EXAMINER, and KNEC_ADMIN.
    Used for marks entry and script-level operations.
    """
 
    ALLOWED_ROLES = {'KNEC_ADMIN', 'CHIEF_EXAMINER', 'TEAM_LEADER', 'EXAMINER'}
    message = "You must be a registered examiner to perform this action."
 
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in self.ALLOWED_ROLES
        )
 
    def has_object_permission(self, request, view, obj):
        """Regular examiners can only view/edit their own marks entries."""
        user = request.user
        if getattr(user, 'role', None) in {'KNEC_ADMIN', 'CHIEF_EXAMINER', 'TEAM_LEADER'}:
            return True
        # For MarksEntry objects
        examiner = getattr(obj, 'examiner', None)
        return examiner and examiner == user
 
 
class IsTeamLeaderOrAbove(BasePermission):
    """Allows TEAM_LEADER, CHIEF_EXAMINER, and KNEC_ADMIN to approve marks."""
 
    ALLOWED_ROLES = {'KNEC_ADMIN', 'CHIEF_EXAMINER', 'TEAM_LEADER'}
    message = "Only team leaders or chief examiners may approve marks entries."
 
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in self.ALLOWED_ROLES
        )
 
 
class IsReadOnly(BasePermission):
    """Allows only safe (read) methods — GET, HEAD, OPTIONS."""
 
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS
 
 
class IsOwnerOrKNECAdmin(BasePermission):
    """
    Object-level permission: the user must own the object or be a KNEC admin.
    'owner' is determined by obj.created_by or obj.examiner.
    """
 
    def has_object_permission(self, request, view, obj):
        if getattr(request.user, 'role', None) == 'KNEC_ADMIN':
            return True
        owner = getattr(obj, 'created_by', None) or getattr(obj, 'examiner', None)
        return owner == request.user
 