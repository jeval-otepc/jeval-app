// Types barrel export file

export * from './common';
export * from './api';
export * from './eval-form';
export * from './position';

// Re-export commonly used types
export type {
    BaseEntity,
    TimestampFields,
    SelectOption,
    NotificationMessage,
    LoadingSpinnerProps,
    ModalProps,
    Theme,
    Language,
    Status
} from './common';

export type {
    ApiResponse,
    ApiError,
    ApiMeta,
    StrapiResponse,
    StrapiEntity,
    UserProfile,
    LoginRequest,
    LoginResponse,
    ApiMethod,
    ApiStatus
} from './api';

export type {
    Question,
    FormId,
    ResultData,
    FormData,
    ValidationError,
    FormSubmissionResult,
    FormStep,
    SubmissionStatus
} from './eval-form';

export type {
    PositionType,
    PositionCategory,
    PositionSelectOption,
    OrganizationType,
    AffiliationData
} from './position';