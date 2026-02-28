import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, subMonths, isSameMonth, isAfter, startOfMonth, format } from "date-fns";
import { ar } from "date-fns/locale";

interface MonthSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function MonthSelector({ selectedDate, onDateChange }: MonthSelectorProps) {
  const { i18n } = useTranslation();
  const now = new Date();
  const isCurrentMonth = isSameMonth(selectedDate, now);
  const isArabic = i18n.language === "ar";

  const nextMonth = addMonths(selectedDate, 1);
  const canGoForward = !isCurrentMonth && !isAfter(startOfMonth(nextMonth), startOfMonth(now));

  const handlePrev = () => {
    onDateChange(subMonths(selectedDate, 1));
  };

  const handleNext = () => {
    if (canGoForward) {
      onDateChange(addMonths(selectedDate, 1));
    }
  };

  const handleReset = () => {
    onDateChange(new Date());
  };

  const locale = isArabic ? ar : undefined;
  const monthLabel = format(selectedDate, "MMMM yyyy", { locale });

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold text-foreground min-w-[160px] text-center">
          {monthLabel}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleNext}
          disabled={isCurrentMonth}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      {isCurrentMonth && (
        <span className="text-xs font-medium text-muted-foreground">
          {isArabic ? "الشهر الحالي" : "Current Month"}
        </span>
      )}
      {!isCurrentMonth && (
        <Button variant="ghost" size="sm" className="text-xs" onClick={handleReset}>
          {isArabic ? "العودة للشهر الحالي" : "Back to Current"}
        </Button>
      )}
    </div>
  );
}
