class BoardNotFoundError(Exception):
    def __init__(self, message=""):
        super().__init__(message)


class UnauthorizedFileExtensionError(Exception):
    def __init__(self, message=""):
        super().__init__(message)


class FileSizeTooLargeError(Exception):
    def __init__(self, message=""):
        super().__init__(message)


class UserFreezedError(Exception):
    def __init__(self, message=""):
        super().__init__(message)


class tooLongError(Exception):
    def __init__(self, message=""):
        super().__init__(message)
