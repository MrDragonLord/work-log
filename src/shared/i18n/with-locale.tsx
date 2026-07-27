import { type ComponentType, createElement } from 'react'

import { useLocale } from './use-locale'

export function withLocale<Props extends object>(Component: ComponentType<Props>): ComponentType<Props> {
	function LocalizedComponent(props: Props) {
		'use no memo'

		const locale = useLocale()

		return createElement(Component, { ...props, locale })
	}

	LocalizedComponent.displayName = `withLocale(${Component.displayName ?? Component.name ?? 'Component'})`

	return LocalizedComponent
}
