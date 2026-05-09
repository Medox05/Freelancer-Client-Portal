import Select from "react-select";

type Option = {
  value: number;
  label: string;
};

type Client = {
  id: number;
  name: string;
};

type Props = {
  label?: string;
  clients: Client[];
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
};

export default function ClientSelect({
  label = "Client",
  clients,
  value,
  onChange,
  placeholder = "Select client...",
}: Props) {
  const options: Option[] = clients.map((client) => ({
    value: client.id,
    label: client.name,
  }));

  const selectedOption =
    options.find((option) => option.value === value) ?? null;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-900 dark:text-white">
        {label}
      </label>

      <Select
        options={options}
        value={selectedOption}
        onChange={(option) => onChange(option ? option.value : null)}
        placeholder={placeholder}
        isSearchable
        className="react-select-container"
        classNamePrefix="react-select"
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: 52,
            borderRadius: 18,
            borderColor: state.isFocused ? "#334155" : "#cbd5e1",
            boxShadow: "none",
            backgroundColor: "#ffffff",
            paddingLeft: 6,
            cursor: "pointer",
            "&:hover": {
              borderColor: "#334155",
            },
          }),
          valueContainer: (base) => ({
            ...base,
            paddingTop: 2,
            paddingBottom: 2,
          }),
          placeholder: (base) => ({
            ...base,
            color: "#94a3b8",
          }),
          singleValue: (base) => ({
            ...base,
            color: "#0f172a",
          }),
          menu: (base) => ({
            ...base,
            borderRadius: 18,
            overflow: "hidden",
            zIndex: 50,
          }),
          menuList: (base) => ({
            ...base,
            paddingTop: 6,
            paddingBottom: 6,
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? "#0f172a"
              : state.isFocused
              ? "#f1f5f9"
              : "#ffffff",
            color: state.isSelected ? "#ffffff" : "#0f172a",
            cursor: "pointer",
            paddingTop: 12,
            paddingBottom: 12,
          }),
          indicatorSeparator: () => ({
            display: "none",
          }),
          dropdownIndicator: (base) => ({
            ...base,
            color: "#64748b",
            "&:hover": {
              color: "#334155",
            },
          }),
        }}
      />
    </div>
  );
}