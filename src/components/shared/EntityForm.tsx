import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter,
  Button,
  Divider
} from '@heroui/react';
import { Save, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { TextField } from '../shared/EntityFormFields';
import { useUIStore } from '~/store';

export interface EntityFormField<T> {
  key: keyof T;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'currency' | 'percentage' | 'select' | 'radio' | 'checkbox' | 'date' | 'custom';
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  hidden?: boolean;
  options?: Array<{ label: string; value: string | number | boolean }>;
  renderInput?: (props: {
    value: any;
    onChange: (value: any) => void;
    error?: string;
    required?: boolean;
  }) => React.ReactNode;
}

export interface EntityFormProps<T> {
  title: string;
  entity: T;
  fields: EntityFormField<T>[];
  errors?: Partial<Record<keyof T, string>>;
  isLoading?: boolean;
  isSubmitting?: boolean;
  showBackButton?: boolean;
  backUrl?: string;
  sections?: Array<{
    title: string;
    fields: Array<keyof T>;
  }>;
  renderCustomFields?: () => React.ReactNode;
  onSubmit: (data: T) => void;
  onChange: (field: keyof T, value: any) => void;
  onCancel?: () => void;
  renderFooterActions?: () => React.ReactNode;
  submitText?: string;
  cancelText?: string;
}

/**
 * A reusable component for entity forms with consistent styling
 * Can be used for creating/editing quotes, customers, products, etc.
 */
export function EntityForm<T>({
  title,
  entity,
  fields,
  errors = {},
  isLoading = false,
  isSubmitting = false,
  showBackButton = true,
  backUrl,
  sections,
  renderCustomFields,
  onSubmit,
  onChange,
  onCancel,
  renderFooterActions,
  submitText = "Save",
  cancelText = "Cancel"
}: EntityFormProps<T>) {
  const router = useRouter();
  // Get UI settings from Zustand store
  const { formSettings, buttonSettings } = useUIStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(entity);
  };

  const handleBack = () => {
    if (onCancel) {
      onCancel();
    } else if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  // Group fields by section if provided
  const renderFields = () => {
    if (sections && sections.length > 0) {
      return sections.map((section, index) => (
        <div key={index} className={`mb-${formSettings.spacing === 'compact' ? '4' : formSettings.spacing === 'relaxed' ? '8' : '6'}`}>
          <h3 className={`text-${formSettings.labelSize === 'sm' ? 'md' : formSettings.labelSize === 'lg' ? 'xl' : 'lg'} font-semibold mb-${formSettings.spacing === 'compact' ? '2' : formSettings.spacing === 'relaxed' ? '6' : '4'}`}>
            {section.title}
          </h3>
          <div className={`space-y-${formSettings.spacing === 'compact' ? '2' : formSettings.spacing === 'relaxed' ? '6' : '4'}`}>
            {section.fields.map((fieldKey) => {
              const field = fields.find((f) => f.key === fieldKey);
              if (!field) return null;
              return renderField(field);
            })}
          </div>
          {index < sections.length - 1 && <Divider className={`my-${formSettings.spacing === 'compact' ? '4' : formSettings.spacing === 'relaxed' ? '8' : '6'}`} />}
        </div>
      ));
    }

    return (
      <div className={`space-y-${formSettings.spacing === 'compact' ? '2' : formSettings.spacing === 'relaxed' ? '6' : '4'}`}>
        {fields.map((field) => renderField(field))}
      </div>
    );
  };

  /**
   * Render a form field based on its type with error handling
   */
  const renderField = (field: EntityFormField<T>) => {
    if (field.hidden) return null;
    
    const { key, label, placeholder, type, required, options, renderInput, helpText } = field;
    const error = errors[key];
    
    // If custom render function is provided, use it
    if (renderInput) {
      return (
        <div key={String(key)} className={`space-y-${formSettings.spacing === 'compact' ? '1' : formSettings.spacing === 'relaxed' ? '3' : '2'}`}>
          <label className={`block text-${formSettings.labelSize} font-medium`}>
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
          {renderInput({
            value: entity[key],
            onChange: (value) => onChange(key, value),
            error,
            required
          })}
          {helpText && (
            <p className="text-sm text-muted-foreground">{helpText}</p>
          )}
          {formSettings.errorPlacement === 'below' && error && (
            <p className="text-sm text-danger">{error}</p>
          )}
        </div>
      );
    }
    
    // Render standard form fields based on type
    switch (type) {
      case 'text':
        return (
          <TextField
            key={String(key)}
            label={label || ''}
            placeholder={placeholder}
            value={(entity[key] as string) || ''}
            onChange={(value) => onChange(key, value)}
            required={required}
            error={error}
          />
        );
      // Default for other field types
      default:
        return (
          <div key={String(key)} className={`space-y-${formSettings.spacing === 'compact' ? '1' : formSettings.spacing === 'relaxed' ? '3' : '2'}`}>
            <label className={`block text-${formSettings.labelSize} font-medium`}>
              {label}
              {required && <span className="text-danger ml-1">*</span>}
            </label>
            <p className="text-xs text-muted-foreground">
              This field requires custom rendering. Use the renderInput prop.
            </p>
            {formSettings.errorPlacement === 'below' && error && (
              <p className="text-sm text-danger">{error}</p>
            )}
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                isIconOnly
                variant="light"
                onPress={handleBack}
                aria-label="Go back"
                size={buttonSettings.size}
              >
                <ArrowLeft size={buttonSettings.size === 'sm' ? 16 : buttonSettings.size === 'lg' ? 24 : 20} />
              </Button>
            )}
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
        </CardHeader>
        
        <Divider />
        
        <CardBody className={`p-${formSettings.spacing === 'compact' ? '4' : formSettings.spacing === 'relaxed' ? '8' : '6'}`}>
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {renderFields()}
              {renderCustomFields && renderCustomFields()}
            </>
          )}
        </CardBody>
        
        <Divider />
        
        <CardFooter className="flex justify-between px-6 py-4">
          <Button
            variant="light"
            onPress={handleBack}
            disabled={isSubmitting}
            size={buttonSettings.size}
          >
            {cancelText}
          </Button>
          
          <div className="flex gap-2">
            {renderFooterActions && renderFooterActions()}
            <Button
              color={buttonSettings.primaryColor}
              type="submit"
              startContent={<Save size={buttonSettings.size === 'sm' ? 16 : buttonSettings.size === 'lg' ? 24 : 18} />}
              isLoading={isSubmitting}
              size={buttonSettings.size}
            >
              {submitText}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
} 