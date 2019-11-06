originalNames = open("./names.txt")

for line in originalNames.readlines():
	with open("./sortednames.txt","a") as sortednames:
		if (len(line)<8):
			sortednames.write(line)

