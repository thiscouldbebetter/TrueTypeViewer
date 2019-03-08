
function FileHelper()
{}
{
	FileHelper.readBytesFromFile = function(file, callback)
	{
		var fileReader = new FileReader();
		fileReader.onloadend = function(fileLoadedEvent)
		{
			if (fileLoadedEvent.target.readyState == FileReader.DONE)
			{
				var bytesFromFile = fileLoadedEvent.target.result;
				callback(bytesFromFile);
			}
		}

		fileReader.readAsBinaryString(file);
	};
}
