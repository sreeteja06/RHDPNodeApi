--create database rhdpTest;
--go

use rhdpTest;
go

create table junctionPoint 
( 
  JID int primary key not null,
  longitude FLOAT not null,
  latitude FLOAT not null,
  area varchar(40) not null,
  city varchar(40) not null,
  junctionName varchar(40) not null
);
go

create table jAccess
(
  JID int not null,
  UserId int not null,
  FOREIGN KEY ( JID ) references junctionPoint (JID)
);
go

create UNIQUE INDEX unqJunLatLon 
    on junctionPoint(longitude, latitude);
go

create UNIQUE INDEX unqJAccess 
    on jAccess(JID, UserId);
go

CREATE PROCEDURE getLocationsForUser
	@inUserId int
AS
BEGIN
	SET NOCOUNT ON;
	select * from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = @inUserId;
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
