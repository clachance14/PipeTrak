#!/bin/bash

# Common icon mappings from v2 to v3
declare -A icon_map=(
    ["BookIcon"]="Book"
    ["HardDriveIcon"]="HardDrive" 
    ["HomeIcon"]="Home"
    ["LogOutIcon"]="LogOut"
    ["MoonIcon"]="Moon"
    ["SunIcon"]="Sun"
    ["CookieIcon"]="Cookie"
    ["EyeIcon"]="Eye"
    ["EyeOffIcon"]="EyeOff"
    ["MinusIcon"]="Minus"
    ["LanguagesIcon"]="Languages"
    ["ChevronsUpDownIcon"]="ChevronsUpDown"
    ["ChevronLeftIcon"]="ChevronLeft"
    ["ChevronRightIcon"]="ChevronRight"
)

# Find all files importing from lucide-react
files=$(find apps/web -name "*.tsx" -o -name "*.ts" | xargs grep -l "from.*lucide-react" 2>/dev/null || true)

for file in $files; do
    if [[ -f "$file" ]]; then
        echo "Processing: $file"
        
        # Fix imports
        for old_icon in "${!icon_map[@]}"; do
            new_icon="${icon_map[$old_icon]}"
            
            # Replace in import statements
            sed -i "s/${old_icon}/${new_icon}/g" "$file"
        done
    fi
done

echo "✅ Lucide-react icon fixes complete"