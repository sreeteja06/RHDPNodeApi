use rhdp;
GO

create table jAccess
(
  JID int not null,
  UserId int not null,
  FOREIGN KEY ( JID ) references junctionPoint (JID)
);
GO

create table jAccessReqList
(
  reqID int not null primary key identity(1,1),
  JID int not null,
  userID int not null,
  FOREIGN KEY ( JID ) references junctionPoint (JID),
  reqStatus bit not null DEFAULT 0,
);
GO

create UNIQUE INDEX unqJAccess 
    on jAccess(JID, UserId);
GO

CREATE PROCEDURE acceptJAccessRequest
  @inReqID int
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM jAccessReqList WHERE reqID = @inReqID;
  INSERT into jAccess (JID, UserId) SELECT JID, userID FROM jAccessReqList where reqID = @inReqID;
END
GO

CREATE PROCEDURE removeUserAccess
	@inUserId int,
	@InJID int
AS
BEGIN
	SET NOCOUNT ON;
	DELETE from jAccess where JID = @InJID and UserId = @inUserId;
END
GO

CREATE PROCEDURE addUserAccess
	@inUserId int,
	@InJID int
AS
BEGIN
	SET NOCOUNT ON;
	INSERT into jAccess values(@InJID, @inUserId);
END
GO

CREATE PROCEDURE getLocationsForUser
	@inUserId int
AS
BEGIN
	SET NOCOUNT ON;
	select * from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = @inUserId;
END
GO