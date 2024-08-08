class BoardNotFoundError(Exception):
    def __init__(self, message=""):
        super().__init__(message)


class UnauthorizedFileExtensionError(Exception):
    def __init__(self, message=""):
        super().__init__(message)


class FileSizeTooLargeError(Exception):
    def __init__(self, message=""):
        super().__init__(message)
