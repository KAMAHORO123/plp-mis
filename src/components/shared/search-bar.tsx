import { translateUi, useSiteLanguage } from '../../i18n/language';
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}
export function SearchBar({ value, onChange, placeholder = "Search here . . .", className, }: SearchBarProps) {
    useSiteLanguage();
    return (<Input type="search" role="searchbox" aria-label={translateUi("Search")} value={value} onChange={(e) => onChange(e.target.value)} placeholder={translateUi(placeholder)} leftIcon={<Search />} className={cn("h-10", className)}/>);
}
