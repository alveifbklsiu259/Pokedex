export const getIdFromURL = (url) => {
	return Number(url.slice(url.lastIndexOf('/', url.lastIndexOf('/') - 1) + 1, url.lastIndexOf('/')))
}

export const transformToKeyName = name => {
	return name.replaceAll('-', '_');
};

export const transformToDash = name => {
	return name.replaceAll('_', '-');
};

export const getNameByLanguage = (defaultName, language, entries) => {
	return language === 'en' ? defaultName : entries.names?.find(entry => entry?.language?.name === transformToDash(language))?.name || defaultName;
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

	if (language === 'ja') {
		result = result?.replaceAll('　', '');
	};

	return result;
};