import csv
from timeit import default_timer as timer
def AskThings(messageToDisplay, possibleAnswerYes):
    print messageToDisplay
    userInput = raw_input()
    userInput.lower()
    isValid = "false"
    for answer in possibleAnswerYes:
        if answer == userInput:
            isValid = "true"
            print "Variable set to true"
            return isValid
    if isValid != "true":
        print "Variable set to false"
    return isValid

displayForumInteractions = AskThings("Display Guild Forum interactions?('Y' or 'N')", ["y", "ye","yes", "yep"])
displayRosterChanges = AskThings("Display Guild Roster Changes?('Yes' or 'No')",["y", "ye","yes", "yep"])
displayGoldInteractions = AskThings("Display Gold Activities?('Yes' or 'No')",["y", "ye","yes", "yep"])
displayGuildBankInteractions = AskThings("Display Guild Bank Activitites?('Yes' or 'No')",["y", "ye","yes", "yep"])
displayGuildStorageExpansion = AskThings("Guild Storage expansions?('Yes' or 'No')",["y", "ye","yes", "yep"])
userSorting = AskThings("Want to sort for a specific user? ('Yes' or 'No')", ["y", "ye","yes", "yep"])
if userSorting == "true":
    print "Enter the user to sort for"
    userToSort = raw_input()

f = open("drakor.csv")
csv_f = csv.reader(f)
data = []
for row in csv_f:
    data.append(row)    
f.close()
rev_data = []
for i in reversed(data[2:]):
    rev_data.append(i)
start = timer()
print "Processing Data"

websiteHTML =  "<!DOCTYPE html><html><head>"
websiteHTML += "<script src='http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js'></script>"
websiteHTML += '<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/u/dt/jqc-1.12.3,dt-1.10.12/datatables.min.css"/>'
websiteHTML += '<script type="text/javascript" src="https://cdn.datatables.net/u/dt/jqc-1.12.3,dt-1.10.12/datatables.min.js"></script>'
websiteHTML += "<title>Drakor-Statistics</title><meta http-equiv='content-type' content='text/html; charset=ISO-8859-1'></head>"
websiteHTML += "<body><table id='myTable' class='display'style='width:100%'><thead><tr><th>User</th><th>Item</th><th>Total</th></tr></thead><tbody>"

users = []
#Get all the users
for dataEntry in rev_data:
    if users.count(dataEntry[2]) == 0:
        users.append(dataEntry[2])

if userSorting == "true":
    users = [userToSort, ""]
users.sort()
for user in users:
    items = {}
    #Get data of guild actions
    for dataThing in rev_data:
        if user == dataThing[2]:
            timestamp = dataThing[1].replace("'","")
            #Switch for determining what has been done
            if "has removed" in dataThing[0] and 'cLinkType' in dataThing[0]:
                action = "Removed an item with a link from the guild bank"
            elif "has removed" in dataThing[0] and "guild coffers" not in dataThing[0]:
                action = "Removed an item from the guild bank"
            elif "has deposited" in dataThing[0] and 'cLinkType' in dataThing[0]:
                action = "Deposited an item with a link into the guild bank"
            elif "has deposited" in dataThing[0] and "guild coffers" not in dataThing[0]:
                action = "Deposited an item into the guild bank"
            elif "to the guild coffers" in dataThing[0]:
                action = "Donated gold into the guild coffers"
            elif "from the guild coffers" in dataThing[0]:
                action = "Removed gold from the guild coffers"
            elif "Updated" in dataThing[0] or "Created" in dataThing[0] or "Added" in dataThing[0]:
                action = "Changed/Created something in the guild forum"
                usedItem = "Forum"
                amount = "???"
                items["Forum"] = "?"
            elif "spent" in dataThing[0]:
                action = "Expanded Guild Storage with tokens"
            elif "changed" in dataThing[0] or "Changed" in dataThing[0]:
                action = "Changed something in the Guild roster"
                usedItem = "Guild Roster"
                amount = "???"
                items["Guild Roster"] = "?"
            elif "kicked" in dataThing[0]:
                action = "Kicked someone out of the Guild"
                usedItem = "Guild Roster"
                amount = "???"
                items["Guild Roster"] = "?"
            elif "has joined" in dataThing[0]:
                action = "Joined the guild"
                usedItem = "Guild Roster"
                amount = "???"
                items["Guild Roster"] = "?"
            elif "Accepted" in dataThing[0]:
                action = "Accepted someone to the guild"
                usedItem = "Guild Roster"
                amount = "???"
                items["Guild Roster"] = "?"
            elif "The guild" in dataThing[0]:
                action = "Leveled up the guild"
                usedItem = "Guild Level"
                amount = "???"
                items["Guild Level"] = "?"
            elif "exported" in dataThing[0]:
                action = "Exported guild data"
                usedItem = "Guild data(.csv File)"
                amount = "???"
                items["Guild data(.csv File)"] = "?"
            elif "left" in dataThing[0]:
                action = "Left the guild"
                usedItem = "Guild Roster"
                amount = "???"
                items["Guild Roster"] = "?"
            elif "Rejected" in dataThing[0]:
                action = "Rejected an application of someone"
                usedItem = "Guild Roster"
                amount = "???"
                items["Guild Roster"] = "?"
            elif "unlocked" in dataThing[0]:
                action = "Unlocked a part of the guild Settlements"
                usedItem = "Guild Settlement"
                amount = "???"
                items["Guild Settlement"] = "?"
            elif "updated" in dataThing[0]:
                action = "Edited the Guild Recruitment Message"
                usedItem = "Guild Recruitment Message"
                amount = "???"
                items["Guild Recruitment Message"] = "?"
            elif "x1 and increased the Guild Storage by" in dataThing[0]:
                action = "Expanded Guild Storage with a container"
            elif "Guild Bank Slots moved" in dataThing[0]:
                action = "movedGuildBankSlotsToAnotherGuild"
            else:
                action = "Unknown"
                usedItem = "Unknown"
                amount = "???"
                items["Unknown"] = "?"
            try:
                if action == "Deposited an item into the guild bank":
                    amount = int(dataThing[0][dataThing[0].index("</span>")+9: dataThing[0].index("into")-1])
                elif action == "Deposited an item with a link into the guild bank":
                    amount = int(1)
                elif action == "Removed an item from the guild bank":
                    amount = int(dataThing[0][dataThing[0].index("</span>")+9: dataThing[0].index("from")-1]) * -1
                elif action == "Removed an item with a link from the guild bank":
                    amount = int(-1)
                elif action == "Donated gold into the guild coffers":
                    amount = int(dataThing[0][dataThing[0].index("areaName")+11: dataThing[0].index("</span>")-1].replace(",",""))
                elif action == "Removed gold from the guild coffers":
                    amount = int(dataThing[0][dataThing[0].index("areaName")+11: dataThing[0].index("</span>")-1].replace(",","")) * -1
                elif action == "Expanded Guild Storage with tokens":
                    amount = int(dataThing[0][dataThing[0].index("space by")+12:dataThing[0].index("</b>",dataThing[0].index("space by"))])
                elif action == "Expanded Guild Storage with a container":
                    amount = int(1)
            except Exception as ex:
                print ex
                print ("When trying to set the amount something has gone wrong.Action: {0} Amount: {1}\nTimestamp in the .vlc file: {2}").format(action, amount, dataThing[1])
            try:
                if action == "Deposited an item into the guild bank" or action == "Removed an item from the guild bank":
                    usedItem = dataThing[0][dataThing[0].index("[")+1: dataThing[0].index("]")]
                elif action == "Deposited an item with a link into the guild bank" or action == "Removed an item with a link from the guild bank":
                    usedItem = ("{0} Level:{1}").format(dataThing[0][dataThing[0].index('cLinkType')+12:dataThing[0].index("</span", dataThing[0].index('cLinkType'))],dataThing[0][dataThing[0].index('cLinkLvl')+11:dataThing[0].index("</span", dataThing[0].index('cLinkLvl'))])
                elif action == "Donated gold into the guild coffers" or action == "Removed gold from the guild coffers":
                    usedItem = "Gold"
                elif action == "Expanded Guild Storage with tokens":
                    usedItem = "Guildbank storage(Tokens)"
                elif action == "Expanded Guild Storage with a container":
                    usedItem = "Guildbank storage(Container)"
                else:
                    usedItem = "???"
            except Exception as ex:
                print ex
                print ("{0} has caused an exception when trying to work with it.\nTimestamp in the .vlc file: {1}").format(action, dataThing[1])
            try:
                if usedItem not in items:
                    items[usedItem] = 0
                if action == "Deposited an item into the guild bank" or action == "Deposited an item with a link into the guild bank" or action == "Donated gold into the guild coffers":
                    items[usedItem] += int(amount)
                elif action =="Expanded Guild Storage with tokens" or action == "Expanded Guild Storage with a container":
                    items[usedItem] += int(amount)
                elif action == "Removed an item from the guild bank" or action == "Removed an item with a link into the guild bank" or action == "Removed gold from the guild coffers":
                    items[usedItem] += int(amount)
            except Exception as ex:
                print ex
            if action == "Unknown":
                websiteHTML += ("<tr><td>{0}</td><td>{1}</td><td>{2}</td><td>{3}</td></tr>").format(user, "Unknown item", "???", "???")
                items[dataThing[0]] = "?"
    #Concat the item statistics into  HTML-table strings after the user is done
    for item in items:
        if items[item] != 0:
            websiteHTML += ("<tr><td>{0}</td><td>{1}</td><td>{2}</td></tr>").format(user, item, items[item])    
websiteHTML += "</tbody></table><script>$(document).ready(function(){$('#myTable').DataTable();});</script></body></html>"
#Open the website file, write stuff into it and close it afterwards
websiteFile = open("DrakorStatisticsTotal.html", "w")
websiteFile.write(websiteHTML)
websiteFile.close()
end = timer()
timePassed = round((end-start))
print ("Finished scanning {0} data entries in about {1} seocnds").format(len(data), timePassed)
print "Press Enter to exit"
raw_input()
