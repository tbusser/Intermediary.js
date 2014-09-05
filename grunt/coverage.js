module.exports = {
	// when the coverage object is received
	// from grunt-mocha it will be saved here
	coverage: null,

	instrument: {
		// files to NOT instrument eg. libs
		// these files will be copied "as is"
		ignore: [
		],
		// files to instrument
		files: [
			{
				src: '**/*.js',
				expand: true,
				cwd: 'lib',
				dest: 'test/src'
			}
		]
	},

	// task for generating reports
	report: {
		reports: ['html', 'text-summary'],
		dest: 'test/reports'
	}
};
