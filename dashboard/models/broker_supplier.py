import sys
from django.db import models
from django.utils.translation import gettext_lazy as _

TESTING = 'test' in sys.argv

class Broker(models.Model):
    """
    Model representing tblBroker (managed=False since it is pre-existing)
    """
    BrokerID = models.IntegerField(primary_key=True, db_column='BrokerID')
    BrokerName = models.CharField(max_length=100, db_column='BrokerName')
    BrokerAddress = models.CharField(max_length=255, null=True, blank=True, db_column='BrokerAddress')
    ContactNo = models.CharField(max_length=50, null=True, blank=True, db_column='ContactNo')
    PANo = models.CharField(max_length=50, null=True, blank=True, db_column='PANo')
    UserCreated = models.CharField(max_length=50, null=True, blank=True, db_column='UserCreated')
    DateCreated = models.DateTimeField(null=True, blank=True, db_column='DateCreated')
    UserModified = models.CharField(max_length=50, null=True, blank=True, db_column='UserModified')
    DateModified = models.DateTimeField(null=True, blank=True, db_column='DateModified')

    class Meta:
        db_table = 'tblBroker'
        managed = TESTING
        ordering = ['BrokerName']

    def __str__(self):
        return self.BrokerName


class VendorSupplier(models.Model):
    """
    Model representing tblVendorSupplier (managed=False since it is pre-existing)
    """
    VendorSupplierID = models.IntegerField(primary_key=True, db_column='VendorSupplierID')
    VendorSupplierName = models.CharField(max_length=100, db_column='VendorSupplierName')
    Address1 = models.CharField(max_length=255, null=True, blank=True, db_column='Address1')
    Address2 = models.CharField(max_length=255, null=True, blank=True, db_column='Address2')
    ContactNo = models.CharField(max_length=50, null=True, blank=True, db_column='ContactNo')
    GSTNo = models.CharField(max_length=50, null=True, blank=True, db_column='GSTNo')
    PANo = models.CharField(max_length=50, null=True, blank=True, db_column='PANo')
    UserCreted = models.CharField(max_length=50, null=True, blank=True, db_column='UserCreted')  # note UserCreted spelling in db schema
    DateCreated = models.DateTimeField(null=True, blank=True, db_column='DateCreated')
    UserModified = models.CharField(max_length=50, null=True, blank=True, db_column='UserModified')
    DateModified = models.DateTimeField(null=True, blank=True, db_column='DateModified')

    class Meta:
        db_table = 'tblVendorSupplier'
        managed = TESTING
        ordering = ['VendorSupplierName']

    def __str__(self):
        return self.VendorSupplierName


class Zone(models.Model):
    """
    Model representing tblZone (managed=False since it is pre-existing)
    """
    ZoneID = models.BigAutoField(primary_key=True, db_column='ZoneID')
    ZoneName = models.CharField(max_length=255, db_column='ZoneName')

    class Meta:
        db_table = 'tblZone'
        managed = False
        ordering = ['ZoneName']

    def __str__(self):
        return self.ZoneName
