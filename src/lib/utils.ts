import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getSymbolFromCurrency(currencyCode: string | undefined): string {
	if (!currencyCode) return '';

	const symbols: { [key: string]: string } = {
		USD: '$',
		EUR: '€'
	};

	return symbols[currencyCode] || currencyCode;
}

export function getHumanPrice(price: string, currencyCode: string) {
	if (!currencyCode) return '';

	const symbols: { [key: string]: string } = {
		USD: `$${price}`,
		EUR: `${price}€`
	};

	return symbols[currencyCode] || currencyCode;
}

type DateStyle = Intl.DateTimeFormatOptions['dateStyle'];

export function formatDate(date: string, dateStyle: DateStyle = 'medium', locales = 'en') {
	// Safari is mad about dashes in the date
	const dateToFormat = new Date(date.replaceAll('-', '/'));
	const dateFormatter = new Intl.DateTimeFormat(locales, { dateStyle });
	return dateFormatter.format(dateToFormat);
}

export type WithElementRef<T> = T & {
	ref?: HTMLElement | null;
};

export type WithoutChildren<T> = Omit<T, 'children'>;
export type WithoutChild<T> = Omit<T, 'child'>;
export type WithoutChildrenOrChild<T> = Omit<T, 'children' | 'child'>;
