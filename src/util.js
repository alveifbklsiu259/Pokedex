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
	return language === 'en' ? defaultName : entries.names.find(entry => entry.language.name === language.replaceAll('_', '-')).name || defaultName;
};