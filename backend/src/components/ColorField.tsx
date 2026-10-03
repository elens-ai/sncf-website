'use client'
import React from 'react'
import { TextInput, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

/** A hex colour field with a swatch to pick from, instead of typing codes blind. */
export const ColorField: TextFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError } = useField<string>({ path })
  const valid = typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)
  return (
    <div className="sncf-color-field">
      <TextInput
        path={path}
        label={field.label}
        description={field.admin?.description}
        required={field.required}
        readOnly={readOnly}
        showError={showError}
        value={value ?? ''}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value)}
        placeholder="#24785b"
        BeforeInput={
          <input
            type="color"
            aria-label={`Pick ${typeof field.label === 'string' ? field.label.toLowerCase() : 'colour'}`}
            className="sncf-color-field__swatch"
            value={valid ? value : '#000000'}
            disabled={readOnly}
            onChange={event => setValue(event.target.value)}
          />
        }
      />
    </div>
  )
}
