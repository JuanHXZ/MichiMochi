function FormSelector({
  id,
  name,
  autoComplete,
  required,
  icon: Icon,
  placeholder = 'Selecciona una opción',
  options = [],
  value = '',
  onChange,
  className = 'form-input',
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}) {
  return (
    <div className="input-wrapper">
      {Icon && <Icon aria-hidden="true" />}
      <select
        id={id}
        name={name}
        autoComplete={autoComplete}
        required={required}
        className={className}
        value={value}
        onChange={onChange}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        style={{ paddingLeft: Icon ? '35px' : '10px', cursor: 'pointer' }}
      >
        <option value="" disabled hidden>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FormSelector;