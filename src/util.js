export const getIdFromURL = url => {
	return url ? Number(url.slice(url.lastIndexOf('/', url.lastIndexOf('/') - 1) + 1, url.lastIndexOf('/'))) : undefined;
};

export const transformToKeyName = name => {
	return name ? name.replaceAll('-', '_') : undefined;
};

export const transformToDash = name => {
	return name ? name.replaceAll('_', '-') : undefined;
};

export const getNameByLanguage = (defaultName, language, entries) => {
	const getMatchName = lang => entries?.names?.find(entry => entry?.language?.name === transformToDash(lang))?.name;
	return language === 'en' ? defaultName : getMatchName(language) ? getMatchName(language) : language === 'ja' ? getMatchName('ja-Hrkt') || defaultName : defaultName;
};

export const getTextByLanguage = (language, entries, dataType, version) => {
	let result;
	const getResult = language => {
		const ignoreVersion = entries?.find(entry => entry?.language?.name === transformToDash(language))?.[dataType];
		if (version) {
			return entries?.find(entry => entry?.language?.name === transformToDash(language) && entry?.version_group?.name === version)?.[dataType] || ignoreVersion;
		} else {
			return ignoreVersion;
		};
	};
	result = getResult(language) || getResult('en');

	if (language === 'ja' || language === 'zh_Hant' || language === 'zh_Hans') {
		result = result?.replace(/　|\n/g, '');
	};

	return result;
};