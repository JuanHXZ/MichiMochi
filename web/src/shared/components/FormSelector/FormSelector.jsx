function FormSelector({ icon: Icon, placeholder = 'Selecciona una opción', options = [], value = '', onChange, className = 'form-input' }) {
  return (
    <div className="input-wrapper">
      {Icon && <Icon />}
      <select
        className={className}
        value={value}
        onChange={onChange}
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