"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Button } from "@ui/components/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@ui/components/command";
import { cn } from "@ui/lib";

interface AutocompleteFieldProps {
	value: string;
	onValueChange: (value: string) => void;
	options: string[];
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

export function AutocompleteField({
	value,
	onValueChange,
	options,
	placeholder = "Select or type new value...",
	className,
	disabled = false,
}: AutocompleteFieldProps) {
	const [open, setOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");

	// Filter options based on search
	const filteredOptions = options.filter((option) =>
		option.toLowerCase().includes(searchValue.toLowerCase()),
	);

	// Check if current search value matches any existing option
	const exactMatch = options.some(
		(option) => option.toLowerCase() === searchValue.toLowerCase(),
	);

	const handleSelect = (selectedValue: string) => {
		// Find the original option that matches (case-insensitive)
		const originalOption =
			options.find(
				(option) =>
					option.toLowerCase() === selectedValue.toLowerCase(),
			) || selectedValue;

		onValueChange(originalOption);
		setOpen(false);
		setSearchValue("");
	};

	const handleAddNew = () => {
		if (searchValue.trim()) {
			onValueChange(searchValue.trim());
			setOpen(false);
			setSearchValue("");
		}
	};

	// Update search value when value changes externally
	useEffect(() => {
		if (!open && value !== searchValue) {
			setSearchValue("");
		}
	}, [value, open, searchValue]);

	const displayValue = value || placeholder;
	const showAddNew =
		searchValue.trim() && !exactMatch && filteredOptions.length === 0;
	const showFilteredResults =
		searchValue.trim() && filteredOptions.length > 0;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn(
						"w-full justify-between font-normal",
						!value && "text-muted-foreground",
						className,
					)}
					disabled={disabled}
				>
					<span className="truncate">{displayValue}</span>
					<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[var(--radix-popover-trigger-width)] p-0"
				side="bottom"
				align="start"
			>
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search or type new value..."
						value={searchValue}
						onValueChange={setSearchValue}
					/>
					<CommandList>
						{/* Show existing options */}
						{(searchValue === "" || showFilteredResults) && (
							<CommandGroup heading="Existing values">
								{(searchValue === ""
									? options
									: filteredOptions
								).map((option) => (
									<CommandItem
										key={option}
										value={option}
										onSelect={(currentValue) => {
											handleSelect(currentValue);
										}}
										className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												value === option
													? "opacity-100"
													: "opacity-0",
											)}
										/>
										{option}
									</CommandItem>
								))}
							</CommandGroup>
						)}

						{/* Show "Add new" option when typing something not in the list */}
						{showAddNew && (
							<CommandGroup heading="Add new">
								<CommandItem
									value={`add-new-${searchValue}`}
									onSelect={() => handleAddNew()}
									className="cursor-pointer text-blue-600"
								>
									<Plus className="mr-2 h-4 w-4" />
									Add "{searchValue.trim()}"
								</CommandItem>
							</CommandGroup>
						)}

						{/* Show empty state when no results and no add option */}
						{!showAddNew && !showFilteredResults && searchValue && (
							<CommandEmpty>
								<div className="text-center py-6">
									<p className="text-sm text-muted-foreground">
										No values found
									</p>
									<Button
										variant="ghost"
										size="sm"
										onClick={handleAddNew}
										className="mt-2 text-blue-600"
									>
										<Plus className="mr-2 h-4 w-4" />
										Add "{searchValue.trim()}"
									</Button>
								</div>
							</CommandEmpty>
						)}

						{/* Show all options when no search */}
						{!searchValue && options.length === 0 && (
							<CommandEmpty>
								<p className="text-sm text-muted-foreground">
									No existing values
								</p>
							</CommandEmpty>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
